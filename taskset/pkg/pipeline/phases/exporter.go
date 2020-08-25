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

package phases

import (
	"scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/phases/accessgate"
	"scheduler/pkg/pipeline/phases/factorgenerator"
	"scheduler/pkg/pipeline/phases/schedulerbinder"
	"scheduler/pkg/pipeline/phases/templatedecorator"
	"scheduler/pkg/pipeline/phases/templatetranslator"
)

func NewAccessGate() pipeline.Phase {
	return accessgate.New()
}

func NewDecorator() pipeline.Phase {
	return templatedecorator.New()
}

func NewFactorGenerator() pipeline.Phase {
	return factorgenerator.New()
}

func NewSchedulerBinder() pipeline.Phase {
	return schedulerbinder.New()
}

func NewTemplateTranslator() pipeline.Phase {
	return templatetranslator.New()
}
