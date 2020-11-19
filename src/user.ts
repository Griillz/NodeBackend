import bcrypt from 'bcrypt';
export class User {
  public userId: string = "";

  public firstName: string = "";

  public lastName: string = "";

  public emailAddress: string = "";

  public password: string = "";

  public hashedPassword: string = "";

  generateHash() {
    this.hashedPassword = bcrypt.hashSync(this.password, 10);
  }
}
