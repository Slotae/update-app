import React, { useMemo, useState } from "react";

class QueueNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedQueue {
  constructor(initialValues = []) {
    this.front = null;
    this.rear = null;
    this.size = 0;

    initialValues.forEach((value) => this.enqueue(value));
  }

  enqueue(value) {
    const node = new QueueNode(value);

    if (!this.front) {
      this.front = node;
      this.rear = node;
    } else {
      this.rear.next = node;
      this.rear = node;
    }

    this.size += 1;
  }

  dequeue() {
    if (!this.front) {
      return null;
    }

    const removed = this.front.value;
    this.front = this.front.next;

    if (!this.front) {
      this.rear = null;
    }

    this.size -= 1;
    return removed;
  }

  toArray() {
    const values = [];
    let current = this.front;

    while (current) {
      values.push(current.value);
      current = current.next;
    }

    return values;
  }
}

const initialFruits = ["Mango", "Apple", "Banana"];

export default function Queue() {
  const [fruit, setFruit] = useState("");
  const [message, setMessage] = useState("");
  const [arrayQueue, setArrayQueue] = useState(initialFruits);
  const [linkedQueue, setLinkedQueue] = useState(() => new LinkedQueue(initialFruits));

  const linkedItems = useMemo(() => linkedQueue.toArray(), [linkedQueue]);

  const enqueueFruit = () => {
    const nextFruit = fruit.trim();

    if (!nextFruit) {
      setMessage("Please enter a fruit name first.");
      return;
    }

    setArrayQueue((current) => [...current, nextFruit]);
    setLinkedQueue((current) => {
      const nextQueue = new LinkedQueue(current.toArray());
      nextQueue.enqueue(nextFruit);
      return nextQueue;
    });
    setMessage(`${nextFruit} joined both queues.`);
    setFruit("");
  };

  const dequeueFruit = () => {
    if (!arrayQueue.length || !linkedItems.length) {
      setMessage("The queue is already empty.");
      return;
    }

    const removedFruit = arrayQueue[0];

    setArrayQueue((current) => current.slice(1));
    setLinkedQueue((current) => {
      const nextQueue = new LinkedQueue(current.toArray());
      nextQueue.dequeue();
      return nextQueue;
    });
    setMessage(`${removedFruit} left the front of the queue.`);
  };

  const resetQueue = () => {
    setArrayQueue(initialFruits);
    setLinkedQueue(new LinkedQueue(initialFruits));
    setFruit("");
    setMessage("Queue reset with the starter fruit set.");
  };

  const stats = [
    { label: "Array Size", value: arrayQueue.length },
    { label: "List Size", value: linkedItems.length },
    { label: "Front Fruit", value: arrayQueue[0] || "-" }
  ];

  return (
    <div className="notes-page queue-page">
      <section className="hero-panel queue-hero">
        <div>
          <p className="eyebrow">Queue Playground</p>
          <h1>Manage a fruit queue with Array and Linked List views side by side.</h1>
          <p className="hero-copy">
            Add a fruit to the rear, remove from the front, and compare how the same queue looks in two
            different data structure styles.
          </p>
        </div>

        <div className="hero-stats">
          {stats.map((item) => (
            <div key={item.label} className="stat-card">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="queue-shell">
        <div className="card queue-control-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Fruit Input</p>
              <h2>Queue Actions</h2>
              <p className="subtitle queue-control-copy">One clean control panel for adding, removing, and resetting fruit.</p>
            </div>
          </div>

          <input
            className="input"
            value={fruit}
            placeholder="Type a fruit name like Orange or Pineapple"
            onChange={(e) => setFruit(e.target.value)}
          />

          {message ? <p className="message">{message}</p> : null}

          <div className="queue-action-grid">
            <button className="btn queue-action-btn" onClick={enqueueFruit} type="button">
              Add To Rear
            </button>
            <button className="btn btn-secondary queue-action-btn" onClick={dequeueFruit} type="button">
              Remove Front
            </button>
            <button className="btn btn-secondary queue-action-btn" onClick={resetQueue} type="button">
              Reset Queue
            </button>
          </div>

          <div className="queue-helper-card">
            <span>Front leaves first</span>
            <span>Rear receives new fruit</span>
          </div>
        </div>

        <div className="queue-grid">
          <article className="card queue-card">
            <div className="queue-card-head">
              <div>
                <p className="eyebrow">Array</p>
                <h3>Array Queue</h3>
              </div>
              <span className="sync-pill">FIFO</span>
            </div>

            <div className="queue-track">
              {arrayQueue.length ? arrayQueue.map((item, index) => (
                <div key={`${item}-${index}`} className="queue-item">
                  <span className="queue-badge">{index === 0 ? "Front" : index === arrayQueue.length - 1 ? "Rear" : "Middle"}</span>
                  <strong>{item}</strong>
                  <small>Index {index}</small>
                </div>
              )) : (
                <div className="empty-state queue-empty-state">
                  <h3>Array queue is empty.</h3>
                  <p className="subtitle">Add a fruit to start the lineup again.</p>
                </div>
              )}
            </div>
          </article>

          <article className="card queue-card">
            <div className="queue-card-head">
              <div>
                <p className="eyebrow">Linked List</p>
                <h3>Linked Queue</h3>
              </div>
              <span className="sync-pill">Node Chain</span>
            </div>

            <div className="linked-queue-track">
              {linkedItems.length ? linkedItems.map((item, index) => (
                <React.Fragment key={`${item}-${index}`}>
                  <div className="queue-item linked-queue-item">
                    <span className="queue-badge">{index === 0 ? "Head" : index === linkedItems.length - 1 ? "Tail" : "Node"}</span>
                    <strong>{item}</strong>
                    <small>{index === linkedItems.length - 1 ? "next → null" : "next → node"}</small>
                  </div>
                  {index < linkedItems.length - 1 ? <div className="queue-arrow">→</div> : null}
                </React.Fragment>
              )) : (
                <div className="empty-state queue-empty-state">
                  <h3>Linked list queue is empty.</h3>
                  <p className="subtitle">Enqueue a fruit to build the node chain.</p>
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
