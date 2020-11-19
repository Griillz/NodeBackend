export class UserReturn {
    public userId: string = "";
  
    public firstName: string = "";
  
    public lastName: string = "";
  
    public emailAddress: string = "";

    constructor(userId: string, firstName: string, lastName: string, emailAddress: string) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.emailAddress = emailAddress;
      }
  }
  