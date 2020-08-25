{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "rest-server-plugin.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "rest-plugin-storage.name" -}}
{{- "storage" -}}
{{- end -}}


{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "rest-server-plugin.fullname" -}}
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

{{- define "rest-plugin-storage.fullname" -}}
{{- printf "%s-%s" (include "rest-server-plugin.fullname" .) (include "rest-plugin-storage.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "rest-server-plugin.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}

{{/*
Selector labels
*/}}
{{- define "rest-server-plugin.selectorLabels" -}}
app.kubernetes.io/name: {{ include "rest-server-plugin.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "rest-server-plugin.labels" -}}
helm.sh/chart: {{ include "rest-server-plugin.chart" . }}
{{ include "rest-server-plugin.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "rest-server-plugin.core-labels" -}}
helm.sh/chart: {{ include "rest-server-plugin.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}


{{- define "rest-plugin-storage.select-labels" -}}
app.kubernetes.io/name: {{ include "rest-plugin-storage.name" . }}
app.kubernetes.io/instance: {{ include "rest-plugin-storage.fullname" . }}
app.kubernetes.io/part-of: {{ include "rest-server-plugin.name" . }}
{{- end -}}

{{- define "rest-plugin-storage.labels" -}}
{{ include "rest-server-plugin.core-labels" . }}
{{ include "rest-plugin-storage.select-labels" . }}
{{- end -}}

{{- define "rest-plugin-storage.host" -}}
{{- printf "%s-0.%s.%s" (include "rest-plugin-storage.fullname" .) (include "rest-plugin-storage.fullname" .) .Release.Namespace -}}
{{- end -}}


{{/*
Create the name of the service account to use
*/}}
{{- define "rest-server-plugin.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (include "rest-server-plugin.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service to use
*/}}
{{- define "rest-server-plugin.serviceName" -}}
{{- printf "%s://%s:%s" .Values.service.protocol (include "rest-server-plugin.fullname" .) .Values.service.port -}}
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