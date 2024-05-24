export const sortMin = (objectPath) => (a, b) => {
  let nameA = a[objectPath]
  let nameB = b[objectPath]

  if (nameA < nameB) {
    return -1;
  } else if (nameA > nameB) {
    return 1;
  }
  return 0;
}

export const sortMax = (objectPath) => (a, b) => {
  let nameA = a[objectPath]
  let nameB = b[objectPath]

  if (nameA < nameB) {
    return 1;
  } else if (nameA > nameB) {
    return -1;
  }
  return 0;
}

export const sortTextMin = (objectPath) => (a, b) => {
  let nameA = a[objectPath].toUpperCase(); // ignore upper and lowercase
  let nameB = b[objectPath].toUpperCase(); // ignore upper and lowercase

  if (nameA < nameB) {
    return -1;
  } else if (nameA > nameB) {
    return 1;
  }
  return 0;
}

export const sortTextMax = (objectPath) => (a, b) => {
  let nameA = a[objectPath].toUpperCase(); // ignore upper and lowercase
  let nameB = b[objectPath].toUpperCase(); // ignore upper and lowercase

  if (nameA < nameB) {
    return 1;
  } else if (nameA > nameB) {
    return -1;
  }
  return 0;
}

export const sortTextAsNumberMin = (objectPath) => (a, b) => {
  let nameA = parseInt(a[objectPath] || 0);
  let nameB = parseInt(b[objectPath] || 0);

  if (nameA < nameB) {
    return -1;
  } else if (nameA > nameB) {
    return 1;
  }
  return 0;
}

export const sortTextAsNumberMax = (objectPath) => (a, b) => {
  let nameA = parseInt(a[objectPath] || 0);
  let nameB = parseInt(b[objectPath] || 0);

  if (nameA < nameB) {
    return 1;
  } else if (nameA > nameB) {
    return -1;
  }
  return 0;
}