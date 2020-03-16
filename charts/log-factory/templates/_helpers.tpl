{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "log-factory.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "log-factory-filebeat.name" -}}
{{- "filebeat" -}}
{{- end -}}

{{- define "log-factory-es.name" -}}
{{- "es" -}}
{{- end -}}


{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "log-factory.fullname" -}}
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

{{- define "log-factory-filebeat.fullname" -}}
{{- printf "%s-%s" (include "log-factory.fullname" .) (include "log-factory-filebeat.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "log-factory-es.fullname" -}}
{{- printf "%s-%s" (include "log-factory.fullname" .) (include "log-factory-es.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "log-factory.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "log-factory.labels" -}}
helm.sh/chart: {{ include "log-factory.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Common select labels
*/}}
{{- define "log-factory.select-labels" -}}
app.kubernetes.io/part-of: {{ include "log-factory.name" . }}
{{- end -}}

{{- define "log-factory-filebeat.select-labels" -}}
app.kubernetes.io/name: {{ include "log-factory-filebeat.name" . }}
app.kubernetes.io/instance: {{ include "log-factory-filebeat.fullname" . }}
{{ include "log-factory.select-labels" . }}
{{- end -}}

{{- define "log-factory-es.select-labels" -}}
app.kubernetes.io/name: {{ include "log-factory-es.name" . }}
app.kubernetes.io/instance: {{ include "log-factory-es.fullname" . }}
{{ include "log-factory.select-labels" . }}
{{- end -}}

{{- define "log-factory-filebeat.labels" -}}
{{ include "log-factory.labels" . }}
{{ include "log-factory-filebeat.select-labels" . }}
{{- end -}}

{{- define "log-factory-es.labels" -}}
{{ include "log-factory.labels" . }}
{{ include "log-factory-es.select-labels" . }}
{{- end -}}

{{- define "log-factory-es.serverlist" -}}
{{- $namespace := .Release.Namespace }}
{{- $name := include "log-factory-es.fullname" . -}}
{{- $es := dict "servers" (list) -}}
{{- range $idx, $v := until (int .Values.es.replicaCount) }}
{{- $noop := printf "%s-%d.%s.%s" $name $idx $name $namespace | append $es.servers | set $es "servers" -}}
{{- end }}
{{- printf "%s" (join "," $es.servers) | quote -}}
{{- end -}}

{{- define "log-factory-es.minimum_master_nodes" -}}
{{- $init_master_counts := (div .Values.es.replicaCount 2) }}
{{- $init_master := (add $init_master_counts 1) -}}
{{- printf "%d" ($init_master) | quote -}}
{{- end -}}

{{- define "log-factory-es.namelist" -}}
{{- $name := include "log-factory-es.fullname" . -}}
{{- $es := dict "servers" (list) -}}
{{- range $idx, $v := until (int .Values.es.replicaCount) -}}
{{- $noop := printf "%s-%d" $name $idx | append $es.servers | set $es "servers" -}}
{{- end -}}
{{- printf "%s" (join "," $es.servers) | quote -}}
{{- end -}}