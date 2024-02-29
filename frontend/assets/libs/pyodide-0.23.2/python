#!/bin/bash
":" /* << "EOF"
This file is a bash/node polyglot. This is needed for a few reasons:

1. In node 14 we must pass `--experimental-wasm-bigint`. In node >14 we cannot
pass --experimental-wasm-bigint

2. Emscripten vendors node 14 so it is desirable not to require node >= 16

3. We could use a bash script in a separate file to determine the flags needed,
but virtualenv looks up the current file and uses it directly. So if we make
python.sh and have it invoke python.js, then the virtualenv will invoke python.js
directly without the `--experimental-wasm-bigint` flag and so the virtualenv won't
work with node 14.

Keeping the bash script and the JavaScript in the same file makes sure that even
inside the virtualenv the proper shell code is executed.
*/

/*
EOF
# bash
set -e
if [[ $1 == "-m" ]] && [[ $2 == "pip" ]]; then
    # redirect python -m pip to execute in host environment
    shift 1
    exec $@
fi

which node > /dev/null  || { \
    >&2 echo "No node executable found on the path" && exit 1; \
}

ARGS=$(node -e "$(cat <<"EOF"
const major_version = Number(process.version.split(".")[0].slice(1));
if(major_version < 14) {
    console.error("Need node version >= 14. Got node version", process.version);
    process.exit(1);
}
if(major_version === 14){
    process.stdout.write("--experimental-wasm-bigint");
} else {
    // If $ARGS is empty, `let args = process.argv.slice(2)` removes the wrong
    // number of arguments. `ARGS=--` is not empty but does nothing.
    process.stdout.write("--");
}
EOF
)")

exec node "$ARGS" "$0" "$@"
*/


const { loadPyodide } = require("./pyodide");
const fs = require("fs");

/**
 * Determine which native top level directories to mount into the Emscripten
 * file system.
 *
 * This is a bit brittle, if the machine has a top level directory with certain
 * names it is possible this could break. The most surprising one here is tmp, I
 * am not sure why but if we link tmp then the process silently fails.
 */
function rootDirsToMount() {
    const skipDirs = ["dev", "lib", "proc", "tmp"];
    return fs
        .readdirSync("/")
        .filter((dir) => !skipDirs.includes(dir))
        .map((dir) => "/" + dir);
}

function dirsToMount() {
    extra_mounts = process.env["_PYODIDE_EXTRA_MOUNTS"] || "";
    return rootDirsToMount().concat(extra_mounts.split(":").filter(s => s))
}

async function main() {
    let args = process.argv.slice(2);
    try {
        py = await loadPyodide({
            args,
            fullStdLib: false,
            _node_mounts: dirsToMount(),
            homedir: process.cwd(),
            // Strip out messages written to stderr while loading
            // After Pyodide is loaded we will replace stdstreams with setupStreams.
            stderr(e) {
                if (
                    [
                        "warning: no blob constructor, cannot create blobs with mimetypes",
                        "warning: no BlobBuilder",
                    ].includes(e.trim())
                ) {
                    return;
                }
                console.warn(e);
            }
        });
    } catch (e) {
        if (e.constructor.name !== "ExitStatus") {
            throw e;
        }
        // If the user passed `--help`, `--version`, or a set of command line
        // arguments that is invalid in some way, we will exit here.
        process.exit(e.status);
    }
    py.setStdout();
    py.setStderr();
    let sideGlobals = py.runPython("{}");
    function handleExit(code) {
        if (code === undefined) {
            code = 0;
        }
        if (py._module._Py_FinalizeEx() < 0) {
            code = 120;
        }
        // It's important to call `process.exit` immediately after
        // `_Py_FinalizeEx` because otherwise any asynchronous tasks still
        // scheduled will segfault.
        process.exit(code);
    };
    sideGlobals.set("handleExit", handleExit);

    py.runPython(
        `
        from pyodide._package_loader import SITE_PACKAGES, should_load_dynlib
        from pyodide.ffi import to_js
        import re
        dynlibs_to_load = to_js([
            str(path) for path in SITE_PACKAGES.glob("**/*.so*")
            if should_load_dynlib(path)
        ])
        `,
        { globals: sideGlobals }
    );
    const dynlibs = sideGlobals.get("dynlibs_to_load");
    for (const dynlib of dynlibs) {
        try {
            await py._module.API.loadDynlib(dynlib);
        } catch(e){
            console.error("Failed to load lib ", dynlib);
            console.error(e);
        }
    }

    py.runPython(
        `
        import asyncio
        # Keep the event loop alive until all tasks are finished, or SystemExit or
        # KeyboardInterupt is raised.
        loop = asyncio.get_event_loop()
        # Make sure we don't run _no_in_progress_handler before we finish _run_main.
        loop._in_progress += 1
        loop._no_in_progress_handler = handleExit
        loop._system_exit_handler = handleExit
        loop._keyboard_interrupt_handler = lambda: handleExit(130)

        # Make shutil.get_terminal_size tell the terminal size accurately.
        import shutil
        from js.process import stdout
        import os
        def get_terminal_size(fallback=(80, 24)):
            columns = getattr(stdout, "columns", None)
            rows = getattr(stdout, "rows", None)
            if columns is None:
                columns = fallback[0]
            if rows is None:
                rows = fallback[1]
            return os.terminal_size((columns, rows))
        shutil.get_terminal_size = get_terminal_size
        `,
        { globals: sideGlobals }
    );

    let errcode;
    try {
        errcode = py._module._run_main();
    } catch (e) {
        // If someone called exit, just exit with the right return code.
        if(e.constructor.name === "ExitStatus"){
            process.exit(e.status);
        }
        // Otherwise if there is some sort of error, include the Python
        // tracebook in addition to the JavaScript traceback
        py._module._dump_traceback();
        throw e;
    }
    if (errcode) {
        process.exit(errcode);
    }
    py.runPython("loop._decrement_in_progress()", { globals: sideGlobals });
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
