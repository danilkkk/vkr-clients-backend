const EMPTY = {};

export default async function(mongooseModel, createManyDTO, fieldName, startPipeline = [], from = 0, count = 100) {
    if (from === undefined || isNaN(from)) {
        from = 0;
    }

    if (count === undefined || isNaN(count)) {
        count = 100;
    }

    if (count <= 0 || from < 0) {
        return EMPTY;
    }

    count = Math.min(1000, count);

    const totalCountAgg = await mongooseModel.aggregate(getTotalCountPipeline(startPipeline || [])).exec();

    let totalCount = 0;

    if (totalCountAgg && totalCountAgg.length) {
        totalCount = totalCountAgg[0].totalCount;
    }

    if (from > totalCount) {
        return EMPTY;
    }

    const documents = await mongooseModel.aggregate(getChunkPipeline(startPipeline || [], from, count)).exec();

    const items = createManyDTO(documents);

    return {
        [fieldName]: items,
        chunk: {
            from: from,
            count: items.length,
            more: totalCount > from + items.length,
            totalCount
        }
    }
}

function getTotalCountPipeline(startPipeline) {
    const pipeline = [...startPipeline];

    pipeline.push({
        '$count': 'totalCount'
    });

    return pipeline;
}

function getChunkPipeline(startPipeline, from, count) {
    const pipeline = [...startPipeline];

    pipeline.push({
        '$skip': from,
    });
    pipeline.push({
        '$limit': count,
    });
    return pipeline;
}