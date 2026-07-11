import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repositoryDir = join(process.cwd(), "src", "server", "repositories");

test("repositories de dominio recebem ApplicationContext nos metodos publicos", () => {
  const repositoryFiles = readdirSync(repositoryDir)
    .filter((fileName) => fileName.endsWith("-repository.ts"))
    .filter((fileName) => fileName !== "database-client.ts");

  assert.ok(repositoryFiles.length > 0);

  for (const fileName of repositoryFiles) {
    const source = readFileSync(join(repositoryDir, fileName), "utf8");
    const interfaceBody = extractInterfaceBody(source);
    const methodSignatures = interfaceBody.match(/^\s+\w+[\s\S]*?\): Promise</gm) ?? [];

    assert.ok(
      methodSignatures.length > 0,
      `${fileName} deve declarar metodos no contrato do repository`,
    );

    for (const signature of methodSignatures) {
      assert.match(
        signature,
        /\(\s*context: ApplicationContext/,
        `${fileName}: metodo de repository deve receber ApplicationContext como primeiro parametro`,
      );
    }
  }
});

test("factories de producao usam DrizzleUnitOfWork transacional", () => {
  const serviceDir = join(process.cwd(), "src", "server", "services");
  const factoryFiles = readdirSync(serviceDir).filter((fileName) =>
    fileName.endsWith("-service-factory.ts"),
  );

  for (const fileName of factoryFiles) {
    const source = readFileSync(join(serviceDir, fileName), "utf8");

    if (source.includes("unitOfWork:")) {
      assert.match(
        source,
        /drizzle-unit-of-work/,
        `${fileName}: factories de producao devem usar UnitOfWork transacional`,
      );
    }
  }
});

function extractInterfaceBody(source: string): string {
  const match = /export interface \w+Repository \{([\s\S]*?)\n\}/.exec(source);
  assert.ok(match, "Repository deve expor uma interface nomeada");

  return match[1] ?? "";
}
