package log

import (
	"os"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var highPriority zap.LevelEnablerFunc = zap.LevelEnablerFunc(func(lvl zapcore.Level) bool {
    return lvl >= zapcore.ErrorLevel
})

var lowPriority zap.LevelEnablerFunc  = zap.LevelEnablerFunc(func(lvl zapcore.Level) bool {
    return lvl < zapcore.ErrorLevel
})


var consoleDebugging zapcore.WriteSyncer = zapcore.Lock(os.Stdout)
var consoleErrors zapcore.WriteSyncer = zapcore.Lock(os.Stderr)

var consoleEncoder zapcore.Encoder = zapcore.NewJSONEncoder(zap.NewDevelopmentEncoderConfig())

var core zapcore.Core = zapcore.NewTee(
		zapcore.NewCore(consoleEncoder, consoleErrors, highPriority),
		zapcore.NewCore(consoleEncoder, consoleDebugging, lowPriority),
)


func GetLogger() *zap.Logger {

	// From a zapcore.Core, it's easy to construct a Logger.
	 
	return zap.New(core)

}