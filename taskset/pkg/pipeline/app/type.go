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
	coreInterface "scheduler/pkg/pipeline/app/interfaces/core"
	featureInterface "scheduler/pkg/pipeline/app/interfaces/feature"
	jobInterface "scheduler/pkg/pipeline/app/interfaces/job"
	kubernetesInterface "scheduler/pkg/pipeline/app/interfaces/kubernetes"
	lifeHookInterface "scheduler/pkg/pipeline/app/interfaces/lifehook"
	storageInterface "scheduler/pkg/pipeline/app/interfaces/storage"
	tokenInterface "scheduler/pkg/pipeline/app/interfaces/token"
	"scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/config"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Service struct {
	JobService        jobInterface.Service
	TokenService      tokenInterface.Service
	FeatureService    featureInterface.Service
	LifeHookService   lifeHookInterface.Service
	CoreService       coreInterface.Service
	StorageService    storageInterface.Service
	KubernetesService kubernetesInterface.Service
}

type App struct {
	config   *config.Config
	router   *gin.Engine
	pipeline *pipeline.Pipeline
	service  *Service
	logger   *zap.Logger
}

type ServiceBinder func(*App) *Service

type RouterBinder func(*App) *gin.Engine
