// Handling asynchronous calls

/* Use forEachAll() when async function has array/matrix inputs:
1. Data: Matrix/Array with the data we want to compute.
2. Each: Async function which runs in each call. Holds the cummulated results in the variable result and calls the next iteration with next().
3. Finish: Function executed at the end of the sequence, returns all results.
4. Sync: If true -> sync execution.
*/
function forEachAll(data, each, finish, sync, otherParams) {
    var n = -1, result = [];
    if(typeof otherParams === 'undefined'){ otherParams = {}; }
    var next = sync ?
        function () {
            if (++n < data.length) { each(data[n], result, next, otherParams); }
            else if (finish)       { finish(result); }
        } :
        (function () {
            function completed() {
                if (++n <= data.length && finish) { finish(result); }
            }
            for (var i = 0; i < data.length; i++) { each(data[i], result, completed, otherParams); }
            return completed;
        }());
    next();
}

// Export modules

module.exports.forEachAll = forEachAll;
