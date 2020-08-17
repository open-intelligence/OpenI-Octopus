// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
//

package app

import (
	"scheduler/pkg/pipeline/components/pipeline"
)

func (a *App) loadPlugins() {
	features, err := a.Services().Feature().GetFeatureList(nil)

	if err != nil {
		panic(err)
	}

	for _, f := range features {
		f.Init()
		if err := a.Pipeline().UpsertFeature(f); err != nil {
			panic(err)
		}
		if err := a.Services().Core().SyncLifeHookByFeature(f); err != nil {
			panic(err)
		}
	}
}

func (a *App) loadJobs() {

	jobCursors, err := a.Services().Job().LoadJobsInPipeline()

	if nil != err {
		panic(err)
	}

	for i := 0; i < len(jobCursors); i++ {
		work, err := pipeline.NewWorkpieceFromJobCursor(jobCursors[i])
		if nil != err {
			panic(err)
		}
		a.Pipeline().AddWorkpiece(work)
	}
}
