# SpecFlow: Construction Specification Decision Workflow Platform

![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-FFCA28?style=flat-square&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0+-06B6D4?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=flat-square&logo=vite)

**A real-time construction decision management platform enabling seamless collaboration between clients, designers, and general contractors through atomic state management and live data synchronization.**

---

## Problem Solved
Large home renovation projects require hundreds of decisions to be approved by the client. Miscommunications across in person meetings, phone calls and messages can lead to friction and wasted time and resources.


**SpecFlow solves this by:**
- Providing a single source of truth for all project decisions
- Providing a clear view of the budget impact for each decision
- Enabling real-time collaboration across all stakeholders
- Automating budget impact calculations
- Guaranteeing data consistency through atomic Firestore transactions
---

##  How it Works

Here is a typical use case for SpecFlow: 

On Tuesday morning the Interior Designer receives final quotes for flooring materials and needs formal sign-off. They open SpecFlow and create a Decision Card titled "Living Room Floor Selection." They input the material details and cost differences. 

After work, the client logs into SpecFlow, reviews the options, and clicks "Approve" on one of the options.

This single click triggers the atomic Firestore transaction:

- The Decision Card status is officially updated to "Approved," recording the Client's timestamped digital signature.

- The parent Project document's runningCostDelta is instantly adjusted appropriately.

On Wednesday afternoon, the General Contractor checks SpecFlow before making some orders. They see the flooring material has appeared in their Spec Book, and they know with certainty that the client approved this selection. The GC places the flooring material order with confidence, without having to pour through the group chat or wait for a call back from the designer. Any member of the project can check the Specification book and see who approved the selection, and when they did so. 

This application demonstrates enterprise-grade data consistency patterns by leveraging Firestore Transactions to atomically update project costs and decision statuses. Every approval is a coordinated multi-document operation that either fully succeeds or fully fails. Real-time Firestore listeners ensure that every user sees live updates instantly without requiring page refreshes or manual polling, creating a seamless collaborative experience.

---

## Tech Stack

### **Front-end**
SpecFlow is built with a TypeScript React front-end; it is styled with Tailwind CSS and uses Lucide icons. 


### **State Management & Real-time Sync**
React's modern context API is used to keep tabs on the authentication state, and Firestore transactions and listerners are used to update data and keep it syncronized across all the users' dashboards.


### **Back-end & Database**
Google Firebase is used for authenticaion, and Firestore is used as a real-time NoSQL document store with transactional guarantees. Approvals are upated atomically and can be trusted to maintain cost delta integrity.


---

##  Notable Features

-  Atomic State Management: Decision approvals and project cost updates are handled as single transactions using Firestore, guaranteeing zero race conditions or data inconsistencies.

- Real-time Collaboration: Live data synchronization via Firestore listeners means all users see instant updates when decisions are approved, rejected, or modified.

- Role-Based Access Control:  Dynamic UI rendering based on user roles:
  - Client: Approves or rejects design decisions
  - Designer: Creates decision cards and can undo approvals (reject workflow)
  - General Contractor (GC): Can also create decision cards without the ability to reject approvals
  
- Budget Tracking: Automatic cost delta calculations based on approved design choices, with visual indicators for budget impacts.

- Responsive Design: Tailwind CSS implementation with mobile-first approach, hamburger menu navigation, and touch-friendly controls for all screen sizes.

---


### Demo Mode

The application launches with:
- Anonymous authentication enabled (`signInAnonymously`)
- Mock project data with sample decisions pre-loaded
- Three user roles available for switching to see the RBAC in action
- "Reset Demo" buttonto clear all user-created data and return to initial state

---

## Project Structure

```
specflow-app/
├── src/
│   ├── components/
│   │   ├── context/          # Authentication context & provider
│   │   ├── pages/            # Page components (LoginPage, ProjectView, etc.)
│   │   └── ui/               # Reusable UI components (DecisionCard, ProjectCard, etc.)
│   ├── data/
│   │   └── interfaces.ts     # TypeScript interfaces for projects, decisions, users
│   ├── firestore.ts          # Firestore operations & transactions
│   ├── firebaseInit.ts       # Firebase initialization & configuration
│   ├── App.tsx               # Main app component with routing
│   └── main.tsx              # React entry point
├── public/                   # Static assets
├── vite.config.ts            # Vite build configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies & scripts
└── README.md                 # This file
```

---



### **Real-time Data Flow**
```
Firebase Firestore (Real-time Listeners)
    ↓
React Context (Auth State)
    ↓
Components (ProjectView, AllDecisionsView, DecisionCard)
    ↓
UI Updates (Instant across all users)
```

### **Core Components**

| Component | Purpose |
|-----------|---------|
| `AuthProvider` | Manages authentication state and user roles |
| `ProjectList` | Displays all projects the user has access to |
| `ProjectView` | Shows project details and decision workflow |
| `AllDecisionsView` | Real-time decision list with filter tabs |
| `DecisionCard` | Individual decision with UI |
| `ProjectHeader` | Displays project metadata and budget tracking |


---


###  More about this project

This project is open source and available under the MIT License.
Developed as a portfolio project by Tyler Miller. Check me out at [Ty.lerMiller.com](Ty.lerMiller.com) or test my email configuration with Tyler@Ty.lerMiller.com.

GitHub: [@tmiller1990](https://github.com/tmiller1990)

- Built with [React](https://react.dev) and [Firebase](https://firebase.google.com)
- Styled with [Tailwind CSS](https://tailwindcss.com) and [Lucide Icons](https://lucide.dev)
- Powered by [Vite](https://vitejs.dev)
