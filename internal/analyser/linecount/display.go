package linecount

import (
	"fmt"
	"slices"
	"strconv"
	"strings"
)

func Display(res Result) error {
	// sort all keys
	keys := make([]string, len(res))
	i := 0
	colLengths := []int{5, 5} // 5 = len("Files"), 5 = len("Lines")
	for key, value := range res {
		keys[i] = key
		colLengths[0] = max(colLengths[0], len(key))
		colLengths[1] = max(colLengths[1], len(strconv.Itoa(value)))
		i++
	}

	slices.Sort(keys)

	// header
	fmt.Println()
	fmt.Println("Line count report ")
	fmt.Println()
	fmt.Printf("%-*s %-*s\n", colLengths[0], "Files", colLengths[1], "Lines")
	fmt.Printf("%s\n", strings.Repeat("-", colLengths[0]+colLengths[1]+1))

	total := 0

	// body
	for _, key := range keys {
		count := res[key]
		fmt.Printf("%-*s %+*v\n", colLengths[0], key, colLengths[1], count)
		total += count
	}

	// total
	fmt.Printf("%s\n", strings.Repeat("-", colLengths[0]+colLengths[1]+1))
	fmt.Printf("%+*s %+*v\n", colLengths[0], "Total", colLengths[1], total)

	return nil
}
