function getPermutations(array: number[]): number[][] {
    const results: number[][] = [];

    function permute(arr: number[], m: number[] = []) {
        if (arr.length === 0) {
            results.push(m);
        } else {
            for (let i = 0; i < arr.length; i++) {
                const current = arr.slice();
                const next = current.splice(i, 1);
                permute(current.slice(), m.concat(next));
            }
        }
    }

    permute(array);
    return results;
}

function getCombinations(array: number[], size: number): number[][] {
    const results: number[][] = [];

    function combine(arr: number[], combination: number[], start: number, depth: number) {
        if (depth === 0) {
            results.push([...combination]);
            return;
        }

        for (let i = start; i <= arr.length - depth; i++) {
            combination.push(arr[i]);
            combine(arr, combination, i + 1, depth - 1);
            combination.pop();
        }
    }

    combine(array, [], 0, size);
    return results;
}

export function getWinnerOrders(array: number[], size: number): number[][] {
    const combinations = getCombinations(array, size);
    const winnerOrders: number[][] = [];

    combinations.forEach(combination => {
        const permutations = getPermutations(combination);
        winnerOrders.push(...permutations);
    });

    return winnerOrders;
}