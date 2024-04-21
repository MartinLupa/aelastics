import { ImmutableStore } from "aelastics-store";
import { Course, Student } from "./university.model.type";

describe("create new object in immutable store", ()=>{

    const immutableStore = new ImmutableStore();
    const pcpp = immutableStore.newObject(Course);
    const student1 = immutableStore.newObject(Student);

  it('log contents', () => {
  
    console.log("immutable store contents: ", immutableStore)
    console.log("ctx contents: ", immutableStore.ctx)

    expect(NaN).toEqual(NaN)
  })
})

