import * as t from "aelastics-types"
import { v4 as uuidv4Generator } from "uuid"
import { ImmutableStore } from "./immutable-store"
import { ImmerableObjectLiteral, getUnderlyingType } from "../common/CommonConstants"

// Define the schema for the university domain
export const UniversitySchema = t.schema("UniversitySchema")

// Define the object types for the university domain
export const ProgramType = t.entity(
  {
    id: t.string,
    name: t.string,
    courses: t.optional(t.arrayOf(t.link(UniversitySchema, "Course", "CourseType"))),
  },
  ["id"],
  "Program",
  UniversitySchema
)

export const CourseType = t.entity(
  {
    id: t.string,
    name: t.string,
    program: t.optional(ProgramType),
  },
  ["id"],
  "Course",
  UniversitySchema
)

// Define the inverse properties for the university domain
t.inverseProps(ProgramType, "courses", CourseType, "program")

// Define the interface types for the university domain
type IProgramType = t.TypeOf<typeof ProgramType> & ImmerableObjectLiteral
type ICourseType = t.TypeOf<typeof CourseType> & ImmerableObjectLiteral

describe("ImmutableStore", () => {
  test("Updating object should maintain immutability", () => {
    // const progStore = new ImmutableStore<{ programs: IProgramType[] }>({ programs: [] })

    // progStore.produce((draft) => {
    //   draft.programs.forEach((program) => {
    //     program.name = "Updated Program 1"
    //     program.addCourses(immutableStore.newObject(CourseType, { id: uuidv4Generator(), name: "Course 1" }))
    //   })
    // })

    let immutableStore = new ImmutableStore<(IProgramType | ICourseType)[]>([])

    const program1 = immutableStore.newObject<IProgramType>(ProgramType, {
      id: uuidv4Generator(),
      name: "Program 1",
      courses: [],
    })

    const course1 = immutableStore.newObject<ICourseType>(CourseType, {
      id: uuidv4Generator(),
      name: "Course 1",
      program: undefined,
    })

    const course2 = immutableStore.newObject<ICourseType>(CourseType, {
      id: uuidv4Generator(),
      name: "Course 2",
      program: undefined,
    })

    const program2 = immutableStore.newObject<IProgramType>(ProgramType, {
      id: uuidv4Generator(),
      name: "Program 2",
      courses: [course1, course2],
    })

    immutableStore.produce((draft) => {
      draft.push(program1)
      draft.push(program2)
    })

    immutableStore.produce((draft) => {
      draft[0].name = "Updated Program 1 name"
    })

    const changedState = immutableStore.getState()
    const changedIdMap = immutableStore.getIdMap()

    expect(changedState[0]).not.toBe(program1)
    expect(changedState[1]).toBe(program2)

    expect(changedIdMap.get(program1["@@aelastics/ID"])).not.toBe(program1)
    expect(changedIdMap.get(program2["@@aelastics/ID"])).toBe(program2)
  })

  test("Adding object should not mutate existing state", () => {
    let immutableStore = new ImmutableStore<{ programs: IProgramType[] }>({ programs: [] })

    const initialState = immutableStore.getState()

    const program: IProgramType = immutableStore.newObject<IProgramType>(ProgramType, {
      id: uuidv4Generator(),
      name: "New Program",
      courses: [],
    })

    immutableStore.produce((draft) => {
      draft.programs.push(program)
    })

    const newState = immutableStore.getState()

    expect(newState.programs).toContain(program)
    expect(initialState).not.toBe(newState)
  })

  test("Removing object should maintain immutability", () => {
    let immutableStore = new ImmutableStore<{ programs: IProgramType[] }>({ programs: [] })

    const initialState = immutableStore.getState()

    const program: IProgramType = immutableStore.newObject(ProgramType, {
      id: uuidv4Generator(),
      name: "Program for Removal",
      courses: [],
    })

    immutableStore.produce((draft) => {
      draft.programs.push(program)
    })

    expect(immutableStore.getState().programs).toHaveLength(1)

    immutableStore.produce((draft) => {
      draft.programs.pop()
    })

    const newState = immutableStore.getState()

    expect(immutableStore.getState().programs).toHaveLength(0)
    expect(initialState).not.toBe(newState)
  })

  test("Deep nested changes should maintain immutability", () => {
    let immutableStore = new ImmutableStore<{ universities: [{ id: string; programs: IProgramType[] }] }>({
      universities: [{ id: "university1", programs: [] }],
    })

    const program: IProgramType = immutableStore.newObject(ProgramType, {
      id: uuidv4Generator(),
      name: "Nested Program",
      courses: [],
    })

    immutableStore.produce((draft) => {
      draft.universities[0].programs.push(program)
    })

    const initialDeptPrograms = immutableStore.getState()
    expect(initialDeptPrograms.universities[0].programs[0].name).toBe("Nested Program")

    immutableStore.produce((draft) => {
      draft.universities[0].programs[0].name = "Updated Nested Program"
    })

    const updatedDeptPrograms = immutableStore.getState().universities[0].programs
    expect(updatedDeptPrograms[0].name).toBe("Updated Nested Program")
    expect(initialDeptPrograms).not.toBe(updatedDeptPrograms)
  })

  test("idMap should synchronize correctly with state changes", () => {
    let immutableStore = new ImmutableStore<{ programs: IProgramType[] }>({ programs: [] })

    const program: IProgramType = immutableStore.newObject(ProgramType, {
      id: uuidv4Generator(),
      name: "Program",
      courses: [],
    })

    immutableStore.produce((draft) => {
      draft.programs.push(program)
      draft.programs[0].name = "Updated Name"
    })

    const idMap = immutableStore.getIdMap()
    const newState = immutableStore.getState()
    const changedProgram = newState.programs[0]

    expect(idMap.get(changedProgram["@@aelastics/ID"]).name).toBe("Updated Name")
  })

  test("Updating mutually referenced aleastic objects should refresh their mutual id references", () => {
    let immutableStore = new ImmutableStore<{
      tutor: ITutorType
      tutee: IStudentType
    }>({
      tutor: {} as ITutorType,
      tutee: {} as IStudentType,
    })

    // Define the schema for the university domain
    const UniversitySchema = t.schema("UniversitySchema")

    // Define the object types for the university domain
    const StudentType = t.entity(
      {
        id: t.string,
        name: t.string,
        tutor: t.optional(t.link(UniversitySchema, "Tutor", "TutorType")),
      },
      ["id"],
      "Student",
      UniversitySchema
    )

    const TutorType = t.entity(
      {
        id: t.string,
        name: t.string,
        tutee: t.optional(StudentType),
      },
      ["id"],
      "Tutor",
      UniversitySchema
    )

    // Define the inverse properties for the university domain
    t.inverseProps(StudentType, "tutor", TutorType, "tutee")

    // Define the interface types for the university domain
    type IStudentType = t.TypeOf<typeof StudentType> & ImmerableObjectLiteral
    type ITutorType = t.TypeOf<typeof TutorType> & ImmerableObjectLiteral

    const tutor: ITutorType = immutableStore.newObject(TutorType, {
      id: uuidv4Generator(),
      name: "Tutor 1",
      tutee: undefined,
    })

    const student: IStudentType = immutableStore.newObject(StudentType, {
      id: uuidv4Generator(),
      name: "Student 1",
      tutor: undefined,
    })

    const initState = immutableStore.getState()
    const initIdMap = immutableStore.getIdMap()

    immutableStore.produce((draft) => {
      draft.tutor = tutor
      draft.tutee = student
    })

    immutableStore.produce((draft) => {
      draft.tutor.tutee = draft.tutee
    })

    const newState = immutableStore.getState()
    const newIdMap = immutableStore.getIdMap()

    // check if the initial state is not the same as the new state
    expect(initState).not.toBe(newState)

    //this only checks if the references are set up
    expect(newState.tutor.tutee).toBe(newState.tutee)
    expect(newState.tutee.tutor).toBe(newState.tutor)

    // next stage is to check if both objects have been reinstantiated
    const changedTutor = newState.tutor
    const changedStudent = newState.tutee

    expect(changedTutor).not.toBe(tutor)
    expect(changedStudent).not.toBe(student)

    // check if the idMap has been updated
    expect(newIdMap.get(changedTutor["@@aelastics/ID"])).toBe(changedTutor)
    expect(newIdMap.get(changedStudent["@@aelastics/ID"])).toBe(changedStudent)
    expect(newIdMap.get(changedTutor["@@aelastics/ID"])).not.toBe(tutor)
    expect(newIdMap.get(changedStudent["@@aelastics/ID"])).not.toBe(student)
  })
})
