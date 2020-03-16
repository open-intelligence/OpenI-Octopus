{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "rest-server.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "rest-server-storage.name" -}}
{{- "storage" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "rest-server.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "rest-server-storage.fullname" -}}
{{- printf "%s-%s" (include "rest-server.fullname" .) (include "rest-server-storage.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "rest-server.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "rest-server.core-labels" -}}
helm.sh/chart: {{ include "rest-server.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "rest-server.select-labels" -}}
app.kubernetes.io/name: {{ include "rest-server.name" . }}
app.kubernetes.io/instance: {{ include "rest-server.fullname" . }}
app.kubernetes.io/part-of: {{ include "rest-server.name" . }}
{{- end -}}

{{- define "rest-server-storage.select-labels" -}}
app.kubernetes.io/name: {{ include "rest-server-storage.name" . }}
app.kubernetes.io/instance: {{ include "rest-server-storage.fullname" . }}
app.kubernetes.io/part-of: {{ include "rest-server.name" . }}
{{- end -}}

{{- define "rest-server.labels" -}}
{{ include "rest-server.core-labels" . }}
{{ include "rest-server.select-labels" . }}
{{- end -}}

{{- define "rest-server-storage.labels" -}}
{{ include "rest-server.core-labels" . }}
{{ include "rest-server-storage.select-labels" . }}
{{- end -}}

{{- define "rest-server-storage.host" -}}
{{- printf "%s-0.%s.%s" (include "rest-server-storage.fullname" .) (include "rest-server-storage.fullname" .) .Release.Namespace -}}
{{- end -}}

{{- define "image-factory-shield.address" -}}
{{- if .Values.imageFactory.customAddr -}}
{{- .Values.imageFactory.customAddr -}}
{{- else -}}
{{- $name := .Values.imageFactory.host -}}
{{- if contains $name .Release.Name -}}
{{- printf "%s://%s.%s:%s" .Values.imageFactory.protocol .Release.Name .Release.Namespace .Values.imageFactory.port -}}
{{- else -}}
{{- printf "%s://%s-%s.%s:%s" .Values.imageFactory.protocol .Release.Name .Values.imageFactory.host .Release.Namespace .Values.imageFactory.port -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "taskset-core.address" -}}
{{- if .Values.tasksetCore.customAddr -}}
{{- .Values.tasksetCore.customAddr -}}
{{- else -}}
{{- $name := .Values.tasksetCore.host -}}
{{- if contains $name .Release.Name -}}
{{- printf "%s://%s-0.%s.%s:%s" .Values.tasksetCore.protocol .Release.Name .Release.Name .Release.Namespace .Values.tasksetCore.port -}}
{{- else -}}
{{- printf "%s://%s-%s-0.%s-%s.%s:%s" .Values.tasksetCore.protocol .Release.Name .Values.tasksetCore.host .Release.Name .Values.tasksetCore.host .Release.Namespace .Values.tasksetCore.port -}}
{{- end -}}
{{- end -}}
{{- end -}}