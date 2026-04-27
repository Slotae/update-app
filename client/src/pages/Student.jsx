import React, { useState } from "react";

// 🔹 Node
class Node {
  constructor(student) {
    this.data = student;
    this.next = null;
    this.prev = null;
  }
}

// 🔹 Doubly Linked List
class DoublyLinkedList {
  constructor() {
    this.head = null;
  }

  add(student) {
    const newNode = new Node(student);

    if (!this.head) {
      this.head = newNode;
      return;
    }

    let temp = this.head;
    while (temp.next) temp = temp.next;

    temp.next = newNode;
    newNode.prev = temp;
  }

  delete(id) {
    let temp = this.head;

    while (temp) {
      if (temp.data.id === id) {
        if (temp.prev) temp.prev.next = temp.next;
        else this.head = temp.next;

        if (temp.next) temp.next.prev = temp.prev;
        return;
      }
      temp = temp.next;
    }
  }

  toArray() {
    let arr = [];
    let temp = this.head;
    while (temp) {
      arr.push(temp.data);
      temp = temp.next;
    }
    return arr;
  }
}

export default function StudentDLL() {
  const [list] = useState(new DoublyLinkedList());
  const [students, setStudents] = useState([]);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [score, setScore] = useState("");

  const refresh = () => {
    setStudents([...list.toArray()]);
  };

  const addStudent = () => {
    if (!id || !name || !score) return;

    list.add({
      id,
      name,
      score: Number(score)
    });

    setId("");
    setName("");
    setScore("");
    refresh();
  };

  const deleteStudent = (id) => {
    list.delete(id);
    refresh();
  };

  const avg =
    students.length > 0
      ? (students.reduce((s, x) => s + x.score, 0) / students.length).toFixed(2)
      : 0;

  const max =
    students.length > 0
      ? students.reduce((a, b) => (a.score > b.score ? a : b))
      : null;

  const min =
    students.length > 0
      ? students.reduce((a, b) => (a.score < b.score ? a : b))
      : null;

  return (
    <div className="notes-page">
      <div className="card">
        <h2>Doubly Linked List - Student</h2>

        <input className="input" placeholder="ID" value={id} onChange={e => setId(e.target.value)} />
        <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="input" type="number" placeholder="Score" value={score} onChange={e => setScore(e.target.value)} />

        <div className="button-row">
          <button className="btn" onClick={addStudent}>Add</button>
        </div>
      </div>

      <div className="card">
        <h3>Student List</h3>

        {students.map((s) => (
          <div key={s.id} style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
            <span>{s.id} - {s.name} : {s.score}</span>
            <button className="btn btn-danger" onClick={() => deleteStudent(s.id)}>Delete</button>
          </div>
        ))}

        <hr />

        <p>Average: {avg}</p>
        <p>Max: {max ? `${max.name} (${max.score})` : "-"}</p>
        <p>Min: {min ? `${min.name} (${min.score})` : "-"}</p>
      </div>
    </div>
  );
}