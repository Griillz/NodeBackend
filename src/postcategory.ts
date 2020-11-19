import { Post } from "./post";
export class PostCategory {
  public categoryId: number = 0;

  public posts: Post[] = [];

  constructor(categoryId: number) {
    this.categoryId = categoryId;
  }

  addPost(post: Post){
    this.posts.push(post);
  }
  }
  