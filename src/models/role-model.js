export class Role {
   name;
   priority;

   constructor(name, priority) {
      this.name = name;
      this.priority = priority;
   }
}

const Roles = {
   UNREGISTERED: new Role('unregistered', 0),
   USER:new Role('user', 1),
   SPECIALIST: new Role('spec', 2),
   SELF_EMPLOYED_SPEC: new Role('self-employed-spec', 3),
   ADMINISTRATOR: new Role('admin', 4),
   SUPERUSER: new Role('superuser', 5),
}

export default Roles;