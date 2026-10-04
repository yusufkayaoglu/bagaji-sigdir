const images = import.meta.glob("../assets/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
export const asset = (name) => images["../assets/" + name + ".webp"];
