import { Document, Schema, Model, model} from "mongoose";

interface Identifiable {
  id: Schema.Types.ObjectId;
}

interface Nameable {
  name(): String;
}

interface Person extends Identifiable, Nameable {
  id: Schema.Types.ObjectId;
  firstName: String;
  middleName: String;
  lastName: String;
  inn: String;
  photoUrl: String;
}

export var StudentSchema = new Schema({
  id: Schema.Types.ObjectId,
  firstName: String,
  middleName: String,
  lastName: String,
  inn: String,
  photoUrl: String
});

export const Student = model("Student", StudentSchema);

export var FacultySchema = new Schema({
  id: Schema.Types.ObjectId,
  name: String
});

export const Faculty = model("Faculty", FacultySchema);

export var SubjectSchema = new Schema({
  id: Schema.Types.ObjectId,
  name: String,
  faculty: Faculty
});

export const Subject = model("Subject", SubjectSchema);

export var TeacherSchema = new Schema({
  id: Schema.Types.ObjectId,
  firstName: String,
  middleName: String,
  lastName: String,
  inn: String,
  photoUrl: String,
  rank: String,
  faculty: Faculty
});

export const Teacher = model("Teacher", TeacherSchema);

export var RecordSchema = new Schema({
  id: Schema.Types.ObjectId,
  proof: String,
  subject: Subject,
  student: Student,
  teacher: Teacher,
  timestamp: Date,
  value: Number
});

export const Record = model("Record", RecordSchema);

export var StreamSchema = new Schema({
  id: Schema.Types.ObjectId,
  subjects: [Subject],
  records: [Record],
  students: [Student]
});

export const Stream = model("Stream", StreamSchema);

export var TermSchema = new Schema({
  id: Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  streams: [Stream]
});

export const Term = model("Term", TermSchema);

export var UniversitySchema = new Schema({
  id: Schema.Types.ObjectId,
  name: String,
  teachers: [Teacher],
  terms: [Term],
  students: [Student]
});

export const University = model("University", UniversitySchema);
