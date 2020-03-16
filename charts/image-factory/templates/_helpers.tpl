{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "image-factory.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "image-factory-agent.name" -}}
{{- "agent" -}}
{{- end -}}

{{- define "image-factory-shield.name" -}}
{{- "shield" -}}
{{- end -}}


{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "image-factory.fullname" -}}
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

{{- define "image-factory-agent.fullname" -}}
{{- printf "%s-%s" (include "image-factory.fullname" .) (include "image-factory-agent.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "image-factory-shield.fullname" -}}
{{- printf "%s-%s" (include "image-factory.fullname" .) (include "image-factory-shield.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "image-factory.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "image-factory.labels" -}}
helm.sh/chart: {{ include "image-factory.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Common select labels
*/}}
{{- define "image-factory.select-labels" -}}
app.kubernetes.io/part-of: {{ include "image-factory.name" . }}
{{- end -}}

{{- define "image-factory-agent.select-labels" -}}
app.kubernetes.io/name: {{ include "image-factory-agent.name" . }}
app.kubernetes.io/instance: {{ include "image-factory-agent.fullname" . }}
{{ include "image-factory.select-labels" . }}
{{- end -}}

{{- define "image-factory-shield.select-labels" -}}
app.kubernetes.io/name: {{ include "image-factory-shield.name" . }}
app.kubernetes.io/instance: {{ include "image-factory-shield.fullname" . }}
{{ include "image-factory.select-labels" . }}
{{- end -}}

{{- define "image-factory-agent.labels" -}}
{{ include "image-factory.labels" . }}
{{ include "image-factory-agent.select-labels" . }}
{{- end -}}

{{- define "image-factory-shield.labels" -}}
{{ include "image-factory.labels" . }}
{{ include "image-factory-shield.select-labels" . }}
{{- end -}}