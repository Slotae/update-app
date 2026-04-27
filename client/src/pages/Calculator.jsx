import React, { useState } from "react";

export default function Calculator() {
  const [mode, setMode] = useState("calc");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const operators = new Set(["+", "-", "*", "/"]);

  // ===== calculator =====
  const handleClick = (value) => setInput((prev) => prev + value);
  const clear = () => {
    setInput("");
    setResult("");
  };
  const backspace = () => setInput((prev) => prev.slice(0, -1));

  const precedence = (op) => {
    if (op === "+" || op === "-") return 1;
    if (op === "*" || op === "/") return 2;
    return 0;
  };

  const tokenizeInfix = (exp) => {
    const compact = exp.replace(/\s+/g, "");
    if (!compact) {
      throw new Error("Empty expression");
    }

    const tokens = [];
    let index = 0;

    while (index < compact.length) {
      const char = compact[index];

      if (/\d|\./.test(char)) {
        let number = char;
        index += 1;

        while (index < compact.length && /[\d.]/.test(compact[index])) {
          number += compact[index];
          index += 1;
        }

        if (!/^\d+(\.\d+)?$|^\.\d+$/.test(number)) {
          throw new Error("Invalid number");
        }

        tokens.push(number);
        continue;
      }

      if (operators.has(char) || char === "(" || char === ")") {
        tokens.push(char);
        index += 1;
        continue;
      }

      throw new Error("Invalid token");
    }

    return tokens;
  };

  const infixToPostfix = (exp) => {
    const tokens = tokenizeInfix(exp);
    const stack = [];
    const out = [];

    for (const token of tokens) {
      if (!Number.isNaN(Number(token))) {
        out.push(token);
      } else if (token === "(") {
        stack.push(token);
      } else if (token === ")") {
        while (stack.length && stack.at(-1) !== "(") {
          out.push(stack.pop());
        }

        if (stack.at(-1) !== "(") {
          throw new Error("Mismatched parentheses");
        }

        stack.pop();
      } else {
        while (stack.length && precedence(stack.at(-1)) >= precedence(token)) {
          out.push(stack.pop());
        }
        stack.push(token);
      }
    }

    while (stack.length) {
      const nextToken = stack.pop();
      if (nextToken === "(") {
        throw new Error("Mismatched parentheses");
      }
      out.push(nextToken);
    }

    return out.join(" ");
  };

  const infixToPrefix = (exp) => {
    const tokens = tokenizeInfix(exp).reverse().map((token) => {
      if (token === "(") return ")";
      if (token === ")") return "(";
      return token;
    });

    return infixToPostfix(tokens.join(" ")).split(" ").reverse().join(" ");
  };

  const tokenizePostfix = (exp) => {
    const trimmed = exp.trim();
    if (!trimmed) {
      throw new Error("Empty expression");
    }

    if (trimmed.includes(" ")) {
      return trimmed.split(/\s+/);
    }

    return trimmed.split("");
  };

  const evalPostfix = (exp) => {
    const stack = [];

    for (const token of tokenizePostfix(exp)) {
      if (!Number.isNaN(Number(token))) {
        stack.push(Number(token));
      } else {
        if (!operators.has(token) || stack.length < 2) {
          throw new Error("Invalid postfix expression");
        }

        const b = stack.pop();
        const a = stack.pop();

        if (token === "+") stack.push(a + b);
        if (token === "-") stack.push(a - b);
        if (token === "*") stack.push(a * b);
        if (token === "/") stack.push(a / b);
      }
    }

    if (stack.length !== 1) {
      throw new Error("Invalid postfix expression");
    }

    return stack[0];
  };

  const calculate = () => {
    try {
      const res = evalPostfix(infixToPostfix(input));
      setResult(res);
    } catch {
      setResult("Error");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "auto" }}>
      <h2>Calculator</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
        <button
          className={`btn ${mode === "calc" ? "nav-btn-active" : ""}`}
          onClick={() => setMode("calc")}
        >
          Calculator
        </button>
        <button
          className={`btn ${mode === "exp" ? "nav-btn-active" : ""}`}
          onClick={() => setMode("exp")}
        >
          Expression
        </button>
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="input"
        placeholder="เช่น (3+5)*2"
      />

      <h3>Result: {result}</h3>

      {mode === "calc" && (
        <div className="calc-buttons">
          <button onClick={clear} className="btn btn-danger">C</button>
          <button onClick={backspace} className="btn btn-secondary">⌫</button>

          {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "+"].map((button) => (
            <button key={button} onClick={() => handleClick(button)} className="btn">
              {button}
            </button>
          ))}

          <button onClick={calculate} className="btn btn-primary-hero">=</button>
        </div>
      )}

      {mode === "exp" && (
        <div style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn"
            onClick={() => {
              try {
                setResult(evalPostfix(infixToPostfix(input)));
              } catch {
                setResult("Error");
              }
            }}
          >
            Infix → Result
          </button>

          <button
            className="btn"
            onClick={() => {
              try {
                setResult(evalPostfix(input));
              } catch {
                setResult("Error");
              }
            }}
          >
            Postfix → Result
          </button>

          <button
            className="btn"
            onClick={() => {
              try {
                setResult(`Postfix: ${infixToPostfix(input)} | Prefix: ${infixToPrefix(input)}`);
              } catch {
                setResult("Error");
              }
            }}
          >
            Convert
          </button>
        </div>
      )}
    </div>
  );
}
