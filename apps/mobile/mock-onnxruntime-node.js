// when the library asks to use the Nodsjs File system like "fs", so the metro.config will route the request to this file
// so we will return empty object, the library receive it and thinks it successfully loaded the file system, and moves on without crashing
module.exports = {};
