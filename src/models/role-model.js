export class Role {
   name;
   priority;
   description;

   constructor(name, priority, description) {
      this.name = name;
      this.priority = priority;
      this.description = description;
   }
}

const Roles = {
   UNREGISTERED: new Role('unregistered', 0, 'Не зарегистрирован'),
   USER: new Role('user', 1, 'Пользователь'),
   EMPLOYEE: new Role('employee', 2, 'Работник'),
   SPECIALIST: new Role('spec', 3, 'Специалист'),
   SELF_EMPLOYED_SPEC: new Role('self-employed-spec', 4, 'Самозанятый специалист'),
   ADMINISTRATOR: new Role('admin', 5, 'Администратор'),
   SUPERUSER: new Role('superuser', 6, 'Суперпользователь'),
}

export default Roles;