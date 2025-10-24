package runner

import (
	"io/fs"
	"log/slog"
	"path/filepath"
)

type Runner struct {
	QueueSize int
	Analyser  Analyser
}

func NewRunner(queueSize int, analyser Analyser) *Runner {
	return &Runner{
		QueueSize: queueSize,
		Analyser:  analyser,
	}
}

func (r *Runner) Analyse(srcPath string) error {
	fileCh := make(chan string, r.QueueSize)
	done := make(chan struct{})

	go r.Analyser.Listen(fileCh, done)

	err := filepath.WalkDir(srcPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			slog.Error("Error accessing path %s: %v\n", path, err)
			// Returning err will stop the walk
			return err
		}

		// Process the file or directory
		if !d.IsDir() {
			fileCh <- path
		}

		// Continue walking
		return nil
	})

	close(fileCh)
	<-done

	return err
}
