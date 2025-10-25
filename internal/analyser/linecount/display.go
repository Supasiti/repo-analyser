package linecount

import (
	"fmt"
	"slices"
	"strconv"
	"strings"
)

func Display(res []*Result, maxFilename, maxCount int) error {
	colLengths := []int{
		max(maxFilename, 5),                 // 5 = len("Files")
		max(len(strconv.Itoa(maxCount)), 5), // 5 = len("Lines")
	}

	slices.SortFunc(res, func(a, b *Result) int {
		return strings.Compare(a.File, b.File)
	})

	// header
	fmt.Println()
	fmt.Println("Line count report ")
	fmt.Println()
	fmt.Printf("%-*s %-*s\n", colLengths[0], "Files", colLengths[1], "Lines")
	fmt.Printf("%s\n", strings.Repeat("-", colLengths[0]+colLengths[1]+1))

	total := 0

	// body
	for _, r := range res {
		fmt.Printf("%-*s %+*v\n", colLengths[0], r.File, colLengths[1], r.Count)
		total += r.Count
	}

	// total
	fmt.Printf("%s\n", strings.Repeat("-", colLengths[0]+colLengths[1]+1))
	fmt.Printf("%+*s %+*v\n", colLengths[0], "Total", colLengths[1], total)

	return nil
}
