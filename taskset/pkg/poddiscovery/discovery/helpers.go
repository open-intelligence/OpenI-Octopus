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

package discovery

import (
	"fmt"
	"io/ioutil"
	"net"
	"os"
	"strings"
)

func getlocalIP() string {

	conn, err := net.Dial("udp", "172.18.0.1:443")

	if err != nil {
		return ""
	}

	defer conn.Close()

	return strings.Split(conn.LocalAddr().String(), ":")[0]
}

func readJSONHosts() ([]byte, error) {

	fd, err := os.OpenFile(HOSTS_JSON_FILE, os.O_RDONLY, os.ModePerm|os.ModeDir|os.ModeExclusive)

	if nil != err {
		if os.IsNotExist(err) {
			return []byte("{}"), nil
		}
		return nil, err
	}

	defer fd.Close()

	buf, err := ioutil.ReadAll(fd)

	if nil != err {
		return []byte("{}"), nil
	}

	if strings.Trim(string(buf), "") == "" {
		return []byte("{}"), nil
	}

	return buf, nil
}

func writeJSONHosts(content []byte) error {

	fd, err := os.OpenFile(HOSTS_JSON_FILE, os.O_CREATE|os.O_WRONLY, os.ModePerm|os.ModeDir|os.ModeExclusive)
	if err != nil {
		return err
	}

	_, err = fd.Write(content)

	if err != nil {
		fd.Close()
		return err
	}

	err = fd.Close()

	return err

}

func genHostName(tasksetName, roleName, index interface{}) string {
	return fmt.Sprintf("%v-%v", roleName, index)
}

func writeHostIPPairs(pairs map[string]string) error {

	hosts := "127.0.0.1 localhost\n" +
		"::1     localhost ip6-localhost ip6-loopback\n" +
		"fe00::0 ip6-localnet\n" +
		"fe00::0 ip6-mcastprefix\n" +
		"fe00::1 ip6-allnodes\n" +
		"fe00::2 ip6-allrouters\n"

	for host, ip := range pairs {
		if "" != ip {
			hosts = hosts + fmt.Sprintf("%s   %s\n", ip, host)
		}
	}

	fd, err := os.OpenFile(HOSTS_FILE, os.O_CREATE|os.O_WRONLY, os.ModePerm|os.ModeDir|os.ModeExclusive)

	if err != nil {
		return err
	}

	_, err = fd.Write([]byte(hosts))

	if err != nil {
		fd.Close()
		return err
	}

	err = fd.Close()

	return err
}
