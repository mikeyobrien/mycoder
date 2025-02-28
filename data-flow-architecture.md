# MyCoder Data Flow Architecture

## Overview

This document describes the data flow within the MyCoder system, showing how information moves between components during execution.

## Main Data Flow

```
+---------------+     +---------------+     +---------------+
|               |     |               |     |               |
|  User Input   +---->+  CLI Parser   +---->+  Agent Init   |
|               |     |               |     |               |
+---------------+     +---------------+     +---------------+
                                                    |
                                                    v
+---------------+     +---------------+     +---------------+
|               |     |               |     |               |
|  Tool Results +<----+  Tool System  |<----+  Anthropic API|
|               |     |               |     |               |
+---------------+     +---------------+     +---------------+
        |                                            ^
        v                                            |
+---------------+                           +---------------+
|               |                           |               |
|  Final Result +-------------------------->+ Message Array |
|               |                           |               |
+---------------+                           +---------------+
```

## Detailed Data Flow

### 1. User Input to Agent Initialization

```
+---------------+
|               |
|  User Input   |
|  - CLI args   |
|  - File       |
|  - Interactive|
|               |
+-------+-------+
        |
        v
+-------+-------+
|               |
|  CLI Parser   |
|  - Parse args |
|  - Validate   |
|  - Add suffix |
|               |
+-------+-------+
        |
        v
+-------+-------+
|               |
|  Agent Init   |
|  - Init logger|
|  - Get tools  |
|  - Create ctx |
|               |
+-------+-------+
```

### 2. Agent Execution Loop

```
+---------------+     +---------------+     +---------------+
|               |     |               |     |               |
| Message Array +---->+ Anthropic API +---->+ API Response  |
|               |     |               |     |               |
+-------+-------+     +---------------+     +-------+-------+
        ^                                           |
        |                                           v
        |                                   +-------+-------+
        |                                   |               |
        |                                   | Process Resp  |
        |                                   | - Text content|
        |                                   | - Tool calls  |
        |                                   |               |
        |                                   +-------+-------+
        |                                           |
        |                                           v
        |                                   +-------+-------+
        |                                   |               |
        |                                   | Execute Tools |
        |                                   | - Validation  |
        |                                   | - Parallel    |
        |                                   | - Results     |
        |                                   |               |
        |                                   +-------+-------+
        |                                           |
        |                                           v
        |                                   +-------+-------+
        |                                   |               |
        +-----------------------------------+ Tool Results  |
                                            |               |
                                            +---------------+
```

### 3. Token Usage Tracking

```
+---------------+     +---------------+     +---------------+
|               |     |               |     |               |
| API Request   +---->+ Token Tracker +---->+ Usage Metrics |
|               |     |               |     |               |
+---------------+     +---------------+     +---------------+
                            |
                            v
                     +------+------+
                     |             |
                     | Sub-Trackers|
                     |             |
                     +-------------+
```

## Message Flow

Messages in MyCoder follow a specific structure and flow:

```
+---------------------+
|     Message Array   |
|                     |
| +----------------+  |
| | User Message   |  |
| | - role: user   |  |
| | - content: text|  |
| +----------------+  |
|                     |
| +----------------+  |
| | Asst Message   |  |
| | - role: asst   |  |
| | - content: text|  |
| | - tool calls   |  |
| +----------------+  |
|                     |
| +----------------+  |
| | Tool Results   |  |
| | - role: user   |  |
| | - tool results |  |
| +----------------+  |
+---------------------+
```

The message array is the primary data structure that maintains the conversation state between the agent and the Anthropic API.

## Tool Call Flow

```
+---------------------+
|    Tool Calls       |
|                     |
| +----------------+  |
| | Tool Call      |  |
| | - name         |  |
| | - id           |  |
| | - input        |  |
| +-------+--------+  |
|         |           |
| +-------v--------+  |
| | Tool Handler    |  |
| | - validation    |  |
| | - execution     |  |
| +-------+--------+  |
|         |           |
| +-------v--------+  |
| | Tool Result     |  |
| | - type          |  |
| | - tool_use_id   |  |
| | - content       |  |
| +----------------+  |
+---------------------+
```

## Sub-Agent Data Flow

```
+---------------------+     +---------------------+
|                     |     |                     |
|  Main Agent         |     |  Sub-Agent          |
|                     |     |                     |
| +----------------+  |     | +----------------+  |
| | Tool Call      +------->+ | New Agent      |  |
| | - subAgent     |  |     | | Instance      |  |
| +----------------+  |     | +-------+--------+  |
|                     |     |         |           |
|                     |     | +-------v--------+  |
|                     |     | | Agent Loop     |  |
|                     |     | | - Messages     |  |
|                     |     | | - Tool calls   |  |
|                     |     | | - Results      |  |
|                     |     | +-------+--------+  |
|                     |     |         |           |
| +----------------+  |     | +-------v--------+  |
| | Continue       |  |     | | Sequence       |  |
| | Execution      +<-------+ | Complete       |  |
| +----------------+  |     | +----------------+  |
+---------------------+     +---------------------+
```

## Browser Automation Data Flow

```
+---------------------+     +---------------------+
|                     |     |                     |
|  Agent              |     |  Browser Manager    |
|                     |     |                     |
| +----------------+  |     | +----------------+  |
| | browseStart    +------->+ | Launch Browser |  |
| +----------------+  |     | +-------+--------+  |
|                     |     |         |           |
| +----------------+  |     | +-------v--------+  |
| | browseMessage  +------->+ | Page Controller|  |
| +----------------+  |     | +-------+--------+  |
|                     |     |         |           |
| +----------------+  |     | +-------v--------+  |
| | Tool Result    +<-------+ | Page Actions   |  |
| +----------------+  |     | +----------------+  |
+---------------------+     +---------------------+
```

## File System Data Flow

```
+---------------------+     +---------------------+
|                     |     |                     |
|  Agent              |     |  File System        |
|                     |     |                     |
| +----------------+  |     | +----------------+  |
| | readFile       +------->+ | Read Operation |  |
| +----------------+  |     | +-------+--------+  |
|                     |     |         |           |
| +----------------+  |     | +-------v--------+  |
| | updateFile     +------->+ | Write Operation|  |
| +----------------+  |     | +----------------+  |
|                     |     |                     |
+---------------------+     +---------------------+
```

## Shell Command Data Flow

```
+---------------------+     +---------------------+
|                     |     |                     |
|  Agent              |     |  Shell System       |
|                     |     |                     |
| +----------------+  |     | +----------------+  |
| | shellStart     +------->+ | Process Start  |  |
| +----------------+  |     | +-------+--------+  |
|                     |     |         |           |
| +----------------+  |     | +-------v--------+  |
| | shellMessage   +------->+ | Process I/O    |  |
| +----------------+  |     | +-------+--------+  |
|                     |     |         |           |
| +----------------+  |     | +-------v--------+  |
| | Tool Result    +<-------+ | Process Output |  |
| +----------------+  |     | +----------------+  |
+---------------------+     +---------------------+
```

## Sequence Completion Flow

```
+---------------------+     +---------------------+
|                     |     |                     |
|  Agent Loop         |     |  CLI Output         |
|                     |     |                     |
| +----------------+  |     | +----------------+  |
| | sequenceComplete+------->+ | Final Result   |  |
| +----------------+  |     | +-------+--------+  |
|                     |     |         |           |
| +----------------+  |     | +-------v--------+  |
| | Token Usage    +------->+ | Usage Display  |  |
| +----------------+  |     | +----------------+  |
+---------------------+     +---------------------+
```

## Error Handling Flow

```
+---------------------+     +---------------------+
|                     |     |                     |
|  Tool Execution     |     |  Error Handler      |
|                     |     |                     |
| +----------------+  |     | +----------------+  |
| | Tool Error     +------->+ | Format Error   |  |
| +----------------+  |     | +-------+--------+  |
|                     |     |         |           |
|                     |     | +-------v--------+  |
|                     |     | | Add to Messages|  |
|                     |     | +-------+--------+  |
|                     |     |         |           |
| +----------------+  |     | +-------v--------+  |
| | Continue Loop  +<-------+ | Return to Agent|  |
| +----------------+  |     | +----------------+  |
+---------------------+     +---------------------+
```
