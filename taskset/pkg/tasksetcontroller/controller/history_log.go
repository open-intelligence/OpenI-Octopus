// MIT License
//
// Copyright (c) PCL. All rights reserved.
//
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

package controller

import (
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func logPodHistory(logger *zap.Logger, msg string, taskset *typeTaskSet.TaskSet, record *typeTaskSet.ReplicaStatus) {

	fields := []zapcore.Field{
		zap.String("QueryKey", "PodHistory"),
		zap.String("TaskSet", taskset.Name),
		zap.String("Namespace", taskset.Namespace),
		zap.String("Role", record.Name),
		zap.Uint("AttemptID", record.TotalRetriedCount),
		zap.Uint("ReplicaIndex", record.Index),
		zap.String("PodName", record.PodName),
		zap.String("PodReason", record.PodReason),
		zap.String("PodIP", record.PodIP),
		zap.String("PodHostIP", record.PodHostIP),
		zap.String("ContainerName", record.ContainerName),
		zap.String("ContainerID", record.ContainerID),
		zap.String("Phase", record.Phase),
		zap.String("PhaseMessage", record.PhaseMessage),
		zap.String("TransitionTime", record.TransitionTime.String()),
		zap.Bool("Stopped", record.Stopped),
	}

	if nil != record.StartAt {
		fields = append(fields, zap.Time("StartAt", record.StartAt.Time))
	}

	if nil != record.FinishAt {
		fields = append(fields, zap.Time("FinishAt", record.FinishAt.Time))
	}

	if nil != record.TerminatedInfo {
		fields = append(fields,
			zap.Int32("ContainerExitCode", record.TerminatedInfo.ExitCode),
			zap.String("ContainerExitMessage", record.TerminatedInfo.ExitMessage),
			zap.Int32("ContainerExitSignal", record.TerminatedInfo.Signal),
			zap.String("ContainerExitReason", record.TerminatedInfo.Reason),
		)
	}

	logger.Info(
		msg,
		fields...,
	)

}
