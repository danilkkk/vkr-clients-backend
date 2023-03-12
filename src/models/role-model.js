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
   USER: new Role('user', 1),
   EMPLOYEE: new Role('employee', 2),
   SPECIALIST: new Role('spec', 3),
   SELF_EMPLOYED_SPEC: new Role('self-employed-spec', 4),
   ADMINISTRATOR: new Role('admin', 5),
   SUPERUSER: new Role('superuser', 6),
}

export default Roles;