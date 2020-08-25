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
)

//Auth : return auth service
func (s *Service) Token() tokenInterface.Service {
	return s.TokenService
}

//Job : return job service
func (s *Service) Job() jobInterface.Service {
	return s.JobService
}

//Feature : return feature service
func (s *Service) Feature() featureInterface.Service {
	return s.FeatureService
}

//LifeHook : return lifehook service
func (s *Service) LifeHook() lifeHookInterface.Service {
	return s.LifeHookService
}

//Core : return core service
func (s *Service) Core() coreInterface.Service {
	return s.CoreService
}

//Storage : return storage service
func (s *Service) Storage() storageInterface.Service {
	return s.StorageService
}

//Kubernetes : return kubernetes service
func (s *Service) Kubernetes() kubernetesInterface.Service {
	return s.KubernetesService
}
