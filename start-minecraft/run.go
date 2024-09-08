package main

import (
	"fmt"
	"time"
)

func main() {
	for i := 0; i < 100000; i++ {
		fmt.Println(i)
	}

	time.Sleep(10 * time.Second)
}
