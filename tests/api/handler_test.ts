import { assertEquals } from "@std/assert";
import { createHandler } from "../../src/api/handler.ts";

Deno.test("API - Root endpoint returns usage information", async () => {
  const handler = createHandler();
  const req = new Request("http://localhost/");
  const res = await handler(req);
  
  assertEquals(res.status, 200);
  
  // Try to parse as JSON - it might be JSON or HTML depending on if index.html exists
  try {
    const data = await res.clone().json();
    assertEquals(typeof data.message, "string");
  } catch (_error) {
    // If it's not JSON, it should be HTML
    const text = await res.text();
    assertEquals(text.includes("Magic Math Calculator"), true);
  }
});

Deno.test("API - Valid number returns correct magic math", async () => {
  const handler = createHandler();
  const req = new Request("http://localhost/5");
  const res = await handler(req);
  
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.input, 5);
  assertEquals(data.result, 26);
  assertEquals(typeof data.algorithm, "string");
});

Deno.test("API - Invalid path returns 400", async () => {
  const handler = createHandler();
  const req = new Request("http://localhost/invalid");
  const res = await handler(req);
  
  assertEquals(res.status, 400);
  const data = await res.json();
  assertEquals(typeof data.error, "string");
});

Deno.test("API - Negative number returns error", async () => {
  const handler = createHandler();
  const req = new Request("http://localhost/-1");
  const res = await handler(req);
  
  assertEquals(res.status, 400);
  const data = await res.json();
  assertEquals(data.error, "Input must be a non-negative integer");
});

Deno.test("API - Benchmark endpoint returns data", async () => {
  const handler = createHandler();
  const req = new Request("http://localhost/benchmark");
  const res = await handler(req);
  
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(typeof data.message, "string");
  assertEquals(Array.isArray(data.tests), true);
}); 