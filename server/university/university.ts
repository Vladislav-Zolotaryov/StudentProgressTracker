import mongoose from "mongoose";

class University {
  id: string;
  name: string;
  teachers: Teacher[];
  terms: Term[];
  students: Student[];
}

interface Identifiable {
  id: string;
}

interface Nameable {
  name(): string;
}

interface Person extends Identifiable, Nameable {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  inn: string;
  photoUrl: string;
}

class Teacher implements Person {
  id: string;
  name(): string {
    return this.firstName + this.middleName + this.lastName;
  }
  firstName: string;
  middleName: string;
  lastName: string;
  inn: string;
  photoUrl: string;
  rank: string;
  faculty: Faculty;
}

class Faculty {
  id: string;
  name: string;
}

class Term {
  id: ObjectId;
}

class Student implements Person {
  id: string;
  name(): string {
    return this.firstName + this.middleName + this.lastName;
  }
  firstName: string;
  middleName: string;
  lastName: string;
  inn: string;
  photoUrl: string;
}
