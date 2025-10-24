package runner

import "strings"

type Analyser interface {
	Listen(<-chan string)
}

type mockAnalyser struct {
	Filenames map[string]bool
	Root      string
}

func newMockAnalyser(root string) *mockAnalyser {
	return &mockAnalyser{
		Filenames: make(map[string]bool, 24),
		Root:      root + "/",
	}
}

func (m *mockAnalyser) Listen(ch <-chan string) {
	for {
		filename, ok := <-ch
		if !ok {
			break
		}

		relFile := strings.Replace(filename, m.Root, "", 1)

		m.Filenames[relFile] = true
	}
}
