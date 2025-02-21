const RESOURCE_SEPARATOR = "-PS-";

function generateRandomString(length) {
  const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    randomString += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }

  return randomString;
}

export default function generateResourceName(name, type, length) {
  if (
    typeof name !== "string" ||
    typeof type !== "string" ||
    typeof length !== "number" ||
    length <= 0
  )
    throw new Error("Invalid input parameters");

  const resourceName = generateRandomString(length);

  return `${resourceName}${RESOURCE_SEPARATOR}${type}-${name}`;
}
