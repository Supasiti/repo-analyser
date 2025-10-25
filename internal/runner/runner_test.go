package runner

import (
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

type MockAnalyser struct{}

func TestRunner_Analyse(t *testing.T) {

	t.Run("success", func(t *testing.T) {
		cwd, _ := os.Getwd()
		root := path.Join(cwd, "../..")
		src := path.Join(root, "testdata/repos/sample-ts/src")

		a := newMockAnalyser(root)
		r := &Runner{
			QueueSize: 2,
			Analyser:  a,
		}
		expectedFiles := []string{
			"testdata/repos/sample-ts/src/common/error.ts",
			"testdata/repos/sample-ts/src/common/jsonResponse.ts",
			"testdata/repos/sample-ts/src/common/logger.ts",
			"testdata/repos/sample-ts/src/dao/docClient.ts",
			"testdata/repos/sample-ts/src/dao/types.ts",
			"testdata/repos/sample-ts/src/dao/userDao.test.ts",
			"testdata/repos/sample-ts/src/dao/userDao.ts",
			"testdata/repos/sample-ts/src/dao/util.ts",
			"testdata/repos/sample-ts/src/handlers/createUser.test.ts",
			"testdata/repos/sample-ts/src/handlers/createUser.ts",
			"testdata/repos/sample-ts/src/handlers/getUser.test.ts",
			"testdata/repos/sample-ts/src/handlers/getUser.ts",
			"testdata/repos/sample-ts/src/handlers/messageLogger.ts",
			"testdata/repos/sample-ts/src/models/types.ts",
			"testdata/repos/sample-ts/src/sns/publisher.ts",
			"testdata/repos/sample-ts/src/sns/snsClient.ts",
			"testdata/repos/sample-ts/src/testData/mockUser.ts",
		}

		r.Analyse(src)

		for _, expected := range expectedFiles {
			assert.True(t, a.Filenames[expected], "%s", expected)
		}
	})
}
