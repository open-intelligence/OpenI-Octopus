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
//

package json

import (
	"sort"
	"strconv"
	"strings"
	//"fmt"
)

// ===================================================APIs===================================================

// IsNewJSONIncrFromOldJSON : API for judge whether
// the newStr json is increased from the oldStr json
func IsNewJSONIncrFromOldJSON(oldStr string, newStr string) bool {
	oldRoot := new(DataNode)
	newRoot := new(DataNode)
	loadData(oldStr, 0, oldRoot)
	loadData(newStr, 0, newRoot)
	onlyAdd := isOnlyAddNewNode(oldRoot, newRoot)
	return onlyAdd
}

// Diff : API for get the diff between two json str,
// make sure the oldStr json tree is completely a subtree of the new one
func Diff(oldStr string, newStr string) string {
	var retStr string
	oldRoot := new(DataNode)
	newRoot := new(DataNode)
	loadData(oldStr, 0, oldRoot)
	loadData(newStr, 0, newRoot)
	onlyAdd := isOnlyAddNewNode(oldRoot, newRoot)
	if onlyAdd {
		_, diffRoot := getNodeDiff(oldRoot, newRoot)
		retStr = dumpTree(diffRoot)
		return retStr
	} else {
		return ""
	}

}

// ===================================================data structue===================================================

// NodeType define the enum type of DataNode
type NodeType = int8

// enum type
const (
	NodeInvalid NodeType = 0
	NodeInt     NodeType = 1
	NodeBool    NodeType = 2
	NodeString  NodeType = 3
	NodeMap     NodeType = 4
	NodeArray   NodeType = 5
	NodeNull    NodeType = 6
)

// DataNode used for build a tree from json str
type DataNode struct {
	nodeType int8 // 1:int, 2:bool, 3:string, 4:map, 5:Array, 6:null
	name     string
	value    interface{}
	//valueBool   bol
	//valueString strig
	child       map[string]*DataNode
	father      *DataNode
	matchedNode *DataNode //record the addr of the matched node when compare two trees
}

// ===================================================parse and dump json string===================================================

// loadData parse json str into a tree of DataNode
func loadData(str string, start int, data *DataNode) int {
	i := start
	for ; i < len(str); i++ {
		i = skipSpace(str, i)
		if i == len(str) {
			break
		}
		if str[i] == ',' || str[i] == ']' || str[i] == '}' {
			continue
		}
		if str[i] == '{' {
			data.nodeType = NodeMap
			data.child = make(map[string]*DataNode)
			return loadMap(str, i+1, data.child, data)
		}
		if str[i] == '[' {
			data.nodeType = NodeArray
			data.child = make(map[string]*DataNode)
			return loadArray(str, i+1, data.child, data)
		}
		if str[i] == '"' {
			val, cur := getName(str, i)
			data.nodeType = NodeString
			data.value = val
			return cur
		}
		cur := getValue(str, i, data)
		return cur

	}
	return i
}

// loadMap parse the map format of json str
func loadMap(str string, start int, mapData map[string]*DataNode, father *DataNode) int {
	i := start
	var name string
	for i < len(str) {
		i = skipSpace(str, i)
		if i == len(str) {
			break
		}
		if str[i] == ',' {
			i++
			continue
		}
		if str[i] == '}' {
			return i + 1
		}
		name, i = getName(str, i)
		for j := i; j < len(str); j++ {
			if str[j] == ':' {
				i = j + 1
				break
			}
		}
		data := new(DataNode)
		i = loadData(str, i, data)
		mapData[name] = data
		data.name = name
		data.father = father
	}
	return i
}

// loadArray parse the array format of json str
func loadArray(str string, start int, mapData map[string]*DataNode, father *DataNode) int {
	arrIdx := 0
	i := start
	for i < len(str) {
		i = skipSpace(str, i)
		if i == len(str) {
			break
		}
		if str[i] == ',' {
			i++
			continue
		}
		if str[i] == ']' {
			return i + 1
		}
		data := new(DataNode)
		i = loadData(str, i, data)
		mapData[strconv.Itoa(arrIdx)] = data
		data.father = father
		arrIdx++
	}
	return i
}

// getValue get a value (int, bool, null) from a json str
func getValue(str string, start int, val *DataNode) int {
	cur := 0
	for i := start; i < len(str); i++ {
		if str[i] == '"' {
			val.nodeType = NodeString
			val.value, cur = getName(str, i)
			return cur
		}
		if str[i] == 't' {
			val.nodeType = NodeBool
			val.value = true
			return i + 4
		}
		if str[i] == 'f' {
			val.nodeType = NodeBool
			val.value = false
			return i + 5
		}
		if str[i] == 'n' {
			val.nodeType = NodeNull
			return i + 4
		}
		if str[i] >= '0' && str[i] <= '9' {
			val.nodeType = NodeInt
			val.value, cur = getNumber(str, i)
			return cur
		}
	}
	return len(str)
}

// getNumber get a number from a json str
func getNumber(str string, start int) (int, int) {
	ret := 0
	i := start
	for ; i < len(str); i++ {
		if str[i] >= '0' && str[i] <= '9' {
			ret = ret*10 + int(str[i]-'0')
		} else {
			return ret, i
		}
	}
	return ret, i
}

// getName get a variable of string type (either key or value) from a json str
func getName(str string, start int) (string, int) {
	i := start
	for ; i < len(str); i++ {
		if str[i] == '"' {
			i++
			break
		}
	}
	for j := i; j < len(str); j++ {
		if str[j] == '"' {
			return str[i:j], j + 1
		}
	}
	return "", len(str)
}

// skipSpace skip the space when parse the json str
func skipSpace(str string, start int) int {
	i := start
	for ; i < len(str); i++ {
		if str[i] == ' ' || str[i] == '\t' || str[i] == '\r' || str[i] == '\n' {
			continue
		}
		break
	}
	return i
}

// dumpTree dump the tree of DataNode into a json string
func dumpTree(node *DataNode) string {
	if node == nil {
		return "{}"
	}
	ret := ""
	switch node.nodeType {
	case NodeMap:
		ret = "{"
		var keys []string
		for k := range node.child {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for i, key := range keys {
			ret += "\"" + key + "\": "
			ret += dumpTree(node.child[key])
			if i < len(keys)-1 {
				ret += ", "
			}
		}
		ret += "}"
	case NodeArray:
		ret = "["
		var keys []string
		for k := range node.child {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for i, key := range keys {
			ret += dumpTree(node.child[key])
			if i < len(keys)-1 {
				ret += ", "
			}
		}
		ret += "]"
	case NodeString:
		ret = "\"" + node.value.(string) + "\""
	case NodeBool:
		if node.value.(bool) {
			ret = "true"
		} else {
			ret = "false"
		}
	case NodeInt:
		ret = strconv.Itoa(node.value.(int))
	case NodeNull:
		ret = "null"
	}
	return ret
}

// ===================================================get diff of two tree===================================================

// isOnlyAddNewNode judge if the tree rooted by oldNode is a subtree of that of the new one
func isOnlyAddNewNode(oldNode *DataNode, newNode *DataNode) bool {
	if oldNode.name == newNode.name && oldNode.nodeType == newNode.nodeType {
		switch oldNode.nodeType {
		case NodeNull:
			return true
		case NodeInt:
			if oldNode.value.(int) == newNode.value.(int) {
				return true
			}
		case NodeBool:
			if oldNode.value.(bool) == newNode.value.(bool) {
				return true
			}
		case NodeString:
			if oldNode.value.(string) == newNode.value.(string) {
				return true
			}
			if oldNode.father != nil && oldNode.father.name == "command" {
				// special logic for command node
				return equalJudgeCommandNode(oldNode.value.(string), newNode.value.(string))
			}
		case NodeMap:
			for k, oldVal := range oldNode.child {
				if k == "nodeSelector" {
					continue
				}
				newVal, exist := newNode.child[k]
				if !exist {
					return false
				} else {
					onlyAdd := isOnlyAddNewNode(oldVal, newVal)
					if !onlyAdd {
						return false
					}
				}
			}
			return true
		case NodeArray:
			success := isArrayMatched(oldNode.child, newNode.child, 0)
			if success {
				return true
			}
		}
	} else if oldNode.name == newNode.name && oldNode.nodeType == NodeNull {
		return true
	}
	return false
}

// isArrayMatched judge if every child (in a array) of oldNode can be a subtree of any child of the newNode,
// Note that two or more children of the oldNode are subtree of the same child of the newNode is not allowed.
func isArrayMatched(oldNode map[string]*DataNode, newNode map[string]*DataNode, oldIdx int) bool {
	if oldIdx >= len(oldNode) {
		return true
	}
	oldKey := strconv.Itoa(oldIdx)
	oldVal := oldNode[oldKey]
	for i := 0; i < len(newNode); i++ {
		newKey := strconv.Itoa(i)
		newVal := newNode[newKey]
		if newVal.matchedNode != nil {
			continue
		}
		onlyAdd := isOnlyAddNewNode(oldVal, newVal)
		if onlyAdd {
			newVal.matchedNode = oldVal
			oldVal.matchedNode = newVal
			success := isArrayMatched(oldNode, newNode, oldIdx+1)
			if success {
				return true
			}
			oldVal.matchedNode = nil
			newVal.matchedNode = nil
		}
	}
	return false
}

// getNodeDiff get the diff tree between the oldNode and the newNode
func getNodeDiff(oldNode *DataNode, newNode *DataNode) (bool, *DataNode) {
	if newNode.name == oldNode.name && newNode.nodeType == oldNode.nodeType {
		var diffNode *DataNode
		hasDiff := false
		switch newNode.nodeType {
		case NodeInt:
			if newNode.value.(int) == oldNode.value.(int) {
				return false, nil
			} else {
				hasDiff = true
				diffNode = new(DataNode)
				copyOneNode(newNode, diffNode)
			}
		case NodeBool:
			if newNode.value.(bool) == oldNode.value.(bool) {
				return false, nil
			} else {
				hasDiff = true
				diffNode = new(DataNode)
				copyOneNode(newNode, diffNode)
			}
		case NodeString:
			if newNode.value.(string) == oldNode.value.(string) {
				return false, nil
			} else {
				hasDiff = true
				diffNode = new(DataNode)
				copyOneNode(newNode, diffNode)
			}
		case NodeMap:
			hasDiff = false
			for k, newVal := range newNode.child {
				oldVal, exist := oldNode.child[k]
				if !exist {
					if diffNode == nil {
						diffNode = createDiffNode(newNode)
					}
					diffNode.child[k] = newVal
					hasDiff = true
				} else {
					childHasDiff, subDiffNode := getNodeDiff(oldVal, newVal)
					if childHasDiff {
						if diffNode == nil {
							diffNode = createDiffNode(newNode)
						}
						diffNode.child[k] = subDiffNode
						hasDiff = true
					}
				}
			}
		case NodeArray:
			for i := 0; i < len(newNode.child); i++ {
				newKey := strconv.Itoa(i)
				newVal := newNode.child[newKey]
				oldVal := newVal.matchedNode
				if oldVal == nil {
					if diffNode == nil {
						diffNode = createDiffNode(newNode)
					}
					diffNode.child[newKey] = newVal
					hasDiff = true
				} else {
					childHasDiff, subDiffNode := getNodeDiff(oldVal, newVal)
					if childHasDiff {
						if diffNode == nil {
							diffNode = createDiffNode(newNode)
						}
						if newNode.name == "command"{
							//  special logic for command node
							diffNode.child = newNode.child
						} else {
							diffNode.child[newKey] = subDiffNode
						}
						hasDiff = true
					}
				}
			}
		}
		return hasDiff, diffNode
	} else if newNode.name == oldNode.name && oldNode.nodeType == NodeNull {
		diffNode := new(DataNode)
		copyOneNode(newNode, diffNode)
		return true, diffNode
	}
	return false, nil
}

// ===================================================helper===================================================

// createDiffNode : helper for create a diff Node
func createDiffNode(srcNode *DataNode) *DataNode {
	diffNode := new(DataNode)
	copyOneNode(srcNode, diffNode)
	diffNode.child = make(map[string]*DataNode)
	return diffNode
}

// copyOneNode : helper for copy between two DataNode
func copyOneNode(srcNode *DataNode, dstNode *DataNode) {
	dstNode.nodeType = srcNode.nodeType
	dstNode.name = srcNode.name
	dstNode.value = srcNode.value
}

// equalJudgeCommandNode : helper for special judge if two string "equal" for the command node
func equalJudgeCommandNode(old string, new string) bool {
	oldArr := strings.Split(old, ";")
	newArr := strings.Split(new, ";")
	sort.Strings(oldArr[:])
	sort.Strings(newArr[:])
	if len(newArr) < len(oldArr) {
		return false
	}
	i := 0
	j := 0
	for ; i < len(oldArr); i++ {
		found := false
		for ; j < len(newArr); j++ {
			if newArr[j] == oldArr[i] {
				j++
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}
