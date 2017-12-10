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

class Subject implements Identifiable {
  id: string;
  name: string;
  faculty: Faculty;
}

class Record {
  id: string;
  proof: string;
  subject: Subject;
  student: Student;
  teacher: Teacher;
  timestamp: Date;
  value: Number;
}

class Stream {
  id: String;
  subjects: Subject[];
  records: Record[];
  students: Student[];
}

class Term {
  id: String;
  startDate: Date;
  endDate: Date;
  streams: Stream[];
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

class University {
  id: String;
  name: String;
  teachers: Teacher[];
  terms: Term[];
  students: Student[];
}
