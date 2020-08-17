{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "taskset-core.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "taskset-core-storage.name" -}}
{{- "storage" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "taskset-core.fullname" -}}
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

{{- define "taskset-core-storage.fullname" -}}
{{- printf "%s-%s" (include "taskset-core.fullname" .) (include "taskset-core-storage.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "taskset-core.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "taskset-core.core-labels" -}}
helm.sh/chart: {{ include "taskset-core.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "taskset-core.select-labels" -}}
app.kubernetes.io/name: {{ include "taskset-core.name" . }}
app.kubernetes.io/instance: {{ include "taskset-core.fullname" . }}
app.kubernetes.io/part-of: {{ include "taskset-core.name" . }}
{{- end -}}

{{- define "taskset-core-storage.select-labels" -}}
app.kubernetes.io/name: {{ include "taskset-core-storage.name" . }}
app.kubernetes.io/instance: {{ include "taskset-core-storage.fullname" . }}
app.kubernetes.io/part-of: {{ include "taskset-core.name" . }}
{{- end -}}

{{- define "taskset-core.labels" -}}
{{ include "taskset-core.core-labels" . }}
{{ include "taskset-core.select-labels" . }}
{{- end -}}

{{- define "taskset-core-storage.labels" -}}
{{ include "taskset-core.core-labels" . }}
{{ include "taskset-core-storage.select-labels" . }}
{{- end -}}

{{- define "taskset-core-storage.host" -}}
{{- printf "%s-0.%s.%s" (include "taskset-core-storage.fullname" .) (include "taskset-core-storage.fullname" .) .Release.Namespace -}}
{{- end -}}