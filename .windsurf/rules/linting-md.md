---
trigger: always_on
---

# TypeScript Linting Rules

## Description
Specific linting rules for TypeScript code.

## Included Files
- `**/*.ts`

## Rules

### 1. Strict Boolean Expressions
- **Description**: Rules for boolean expressions.
- **Rule**: Never use objects, strings, or numbers directly in conditions. Use explicit checks (`===`, `!==`) instead of truthy/falsy evaluations. For objects, check if properties exist using the `in` operator or optional chaining.

### 2. Null Safety
- **Description**: Rules for handling null and undefined.
- **Rule**: Use explicit null checks (`== null`, `!= null`). Prefer optional chaining (`?.`) for nested property access. Use nullish coalescing (`??`) for default values.

### 3. No Implicit Any
- **Description**: Avoid implicit `any` types.
- **Rule**: Always specify types explicitly. Avoid using `any` type. Use `unknown` if the type is truly unknown.

### 4. Type Inference Over Explicit `any`
- **Description**: Best practices for type inference.
- **Rule**: Leverage TypeScript's powerful type inference whenever possible. Avoid using `any` or `unknown` unless absolutely necessary. TypeScript is capable of inferring types in most cases, so let it do the work instead of manually typing everything.

### 5. Use `readonly` for Immutable Data
- **Description**: Ensuring immutability of data.
- **Rule**: Prefer `readonly` for properties and arrays that should not be modified. This enforces immutability and reduces accidental data modification, improving code safety.

### 6. Avoid Using `Object` as a Type
- **Description**: Avoid the generic `Object` type.
- **Rule**: Never use `Object` as a type. It is too general and does not provide any meaningful type safety. Use more specific types like `Record<string, any>`, `object`, or custom types where appropriate.

### 7. Prefer `interface` Over `type` for Object Shapes
- **Description**: Best practices for defining object shapes.
- **Rule**: Prefer using `interface` to define object shapes rather than `type` when possible. `interface` offers better extendability and is more idiomatic for object shapes in TypeScript.

### 8. Avoid `any` in Function Parameters
- **Description**: Strict typing for function parameters.
- **Rule**: Avoid using `any` for function parameters. Explicitly define parameter types to ensure type safety. If unsure of a parameter's type, consider using `unknown` and validating the type at runtime.

### 9. Prefer Destructuring for Function Parameters
- **Description**: Improve code clarity using destructuring.
- **Rule**: Prefer destructuring when accepting objects as function parameters. This makes the code cleaner, improves readability, and provides better type checking.

### 10. Use Template Literals for String Concatenation
- **Description**: Enhance code readability with template literals.
- **Rule**: Use template literals (`${}`) for string concatenation instead of the `+` operator. This enhances readability and avoids potential pitfalls with string concatenation.

### 11. Avoid `console.log` in Production Code
- **Description**: Keep production code clean.
- **Rule**: Avoid using `console.log` for debugging in production code. Use proper logging mechanisms and ensure that `console.log` statements are removed before deploying the code.

### 12. Prefer `const` and `let` Over `var`
- **Description**: Use block-scoped variable declarations.
- **Rule**: Avoid using `var` for variable declarations. Prefer `const` for constants and `let` for variables that might change. This ensures better scoping and avoids issues with variable hoisting.

### 13. Prefer `async/await` Over Promises
- **Description**: Asynchronous code management best practices.
- **Rule**: Prefer using `async/await` over `.then()` and `.catch()` for handling asynchronous code. `async/await` is more readable, avoids callback hell, and reduces errors in promise chains.

### 14. Avoid `function` Declarations in TypeScript
- **Description**: Use function expressions over function declarations.
- **Rule**: Avoid using function declarations in TypeScript. Instead, use function expressions (arrow functions). This ensures consistent scoping and makes your code easier to reason about.

### 15. Avoid Nested Ternary Operators
- **Description**: Maintain code readability.
- **Rule**: Avoid nested ternary operators as they can make code difficult to read and maintain. If a conditional is complex, consider using `if`/`else` statements for clarity.