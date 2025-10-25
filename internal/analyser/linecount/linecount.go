package linecount

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"sync"
)

type Result struct {
	File  string
	Count int
}

type LineCount struct {
	MaxCount    int
	MaxFilename int
	NumWorker   int
	mu          sync.Mutex
	Results     []*Result
}

const (
	initialCapacity = 128
)

func NewLineCount(numWorker int) *LineCount {
	initResult := make([]*Result, 0, initialCapacity)

	return &LineCount{Results: initResult, NumWorker: numWorker}
}

func (l *LineCount) Listen(ch <-chan string) {
	var wg sync.WaitGroup
	for range l.NumWorker {
		wg.Add(1)

		go func() {
			defer wg.Done()
			l.ProcessFile(ch)
		}()
	}

	wg.Wait()

	// display result
	slog.Info("Preparing report")
	Display(l.Results, l.MaxFilename, l.MaxCount)
}

func (l *LineCount) ProcessFile(ch <-chan string) {
	for {
		filename, ok := <-ch
		if !ok {
			slog.Debug("channel is closed")
			break
		}

		if err := l.AnalyseFile(filename); err != nil {
			slog.Error("error analysing file", slog.Any("error", err))
			return
		}
	}
}

func (l *LineCount) AnalyseFile(filename string) error {
	file, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("error opening file: %v", err)
	}
	defer file.Close()

	numLine := 0

	// Reader is faster than Scanner
	reader := bufio.NewReader(file)
	for {
		if _, err := reader.ReadString('\n'); err != nil {
			// End of file
			if errors.Is(err, io.EOF) {
				break
			}
			// other error
			return fmt.Errorf("error reading file: %v", err)
		}
		numLine += 1
	}

	l.mu.Lock()
	l.Results = append(l.Results, &Result{File: filename, Count: numLine})
	l.MaxCount = max(l.MaxCount, numLine)
	l.MaxFilename = max(l.MaxFilename, len(filename))
	l.mu.Unlock()

	return nil
}
