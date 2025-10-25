package main

import (
	"log/slog"
	"os"

	"github.com/Supasiti/repo-analyser/internal/analyser/linecount"
	"github.com/Supasiti/repo-analyser/internal/runner"
)

const (
	srcPath   = "./testdata/repos/sample-ts/src"
	numWorker = 2
)

func checkErr(err error, msg string) {
	if err != nil {
		slog.Error(msg, slog.Any("err", err))
		os.Exit(1)
	}
}

func main() {
	slog.Info("Start analysing")
	analyser := linecount.NewLineCount(numWorker)
	runner := runner.NewRunner(100, analyser)
	err := runner.Analyse(srcPath)

	checkErr(err, "Error walking the directory tree")
}
