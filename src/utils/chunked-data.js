const EMPTY = {};

export default async function(mongooseModel, createManyDTO, fieldName, from = 0, count = 100) {
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

    const [{totalCount}] = await mongooseModel.aggregate(TOTAL_COUNT_PIPELINE).exec();

    if (from > totalCount) {
        return EMPTY;
    }

    const documents = await mongooseModel.aggregate(getChunkPipeline(from, count)).exec();

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

const TOTAL_COUNT_PIPELINE = [
    {
        '$count': 'totalCount'
    }
];

function getChunkPipeline(from, count) {
    return [
        {
            '$skip': from,
        },
        {
            '$limit': count,
        }
    ]
}