import { Category } from "./category";
export class CategoryPost {
  public postId: number = 0;
  
  public categories:  Category[] = [];

  constructor(postId: number) {
    this.postId = postId;
  }

  addCategory(category: Category){
    this.categories.push(category);
  }
  }