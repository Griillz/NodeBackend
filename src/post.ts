export class Post {
  public postId: number = 0;

  public createdDate: string = "";

  public title: string = "";

  public content: string = "";

  public userId: string = "";

  public headerImage: string = "";

  public lastUpdated: string = "";

  constructor(
    postId: number,
    createDate: string,
    title: string,
    content: string,
    userId: string,
    headerImage: string,
    lastUpdated: string
  ) {
    this.postId = postId;
    this.createdDate = createDate;
    this.title = title;
    this.content = content;
    this.userId = userId;
    this.headerImage = headerImage;
    this.lastUpdated = lastUpdated;
  }
}
