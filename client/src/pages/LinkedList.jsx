import React, { useState } from "react";

export default function LinkedList() {
  const [list, setList] = useState([73, 2, 52, 18, 36]);
  const [value, setValue] = useState("");
  const [after, setAfter] = useState("");

  const insertNode = () => {
    const num = Number(value);
    const target = Number(after);

    if (isNaN(num) || isNaN(target)) {
      alert("กรอกตัวเลขให้ถูก");
      return;
    }

    const index = list.indexOf(target);

    if (index === -1) {
      alert("ไม่พบค่าที่ต้องการแทรกหลัง");
      return;
    }

    const newList = [...list];
    newList.splice(index + 1, 0, num);

    setList(newList);
    setValue("");
    setAfter("");
  };

  return (
    <div className="notes-page">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <p className="eyebrow">Data Structure</p>
        <h2>Linked List Insert</h2>

        {/* แสดง list */}
        <div className="card" style={{ marginTop: 16 }}>
          <strong>Current List</strong>
          <p style={{ marginTop: 8 }}>
            {list.join(" → ")}
          </p>
        </div>

        {/* input */}
        <div style={{ marginTop: 16 }}>
          <input
            className="input"
            placeholder="เลขที่ต้องการแทรก (เช่น 22)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <input
            className="input"
            placeholder="แทรกหลังเลขอะไร (เช่น 2)"
            value={after}
            onChange={(e) => setAfter(e.target.value)}
          />
        </div>

        {/* ปุ่ม */}
        <div className="button-row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary-hero" onClick={insertNode}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}