import { assertEquals } from "@std/assert";
import { createHandler } from "./api.ts";

Deno.test("API - Root endpoint returns usage information", async () => {
  const handler = createHandler();
  const req = new Request("http://localhost/");
  const res = await handler(req);
  
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.message, "Magic Math API");
  assertEquals(typeof data.usage, "string");
});

Deno.test("API - Valid number returns correct magic math", async () => {
  const handler = createHandler();
  const req = new Request("http://localhost/5");
  const res = await handler(req);
  
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.input, 5);
  assertEquals(data.result, 26);
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