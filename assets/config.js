/* Workshop settings. After deploying the Apps Script web app (see backend/SETUP.md),
   paste its URL into `endpoint`. Leave it empty to run in demo mode (answers stay on this device). */
window.BL_CONFIG = {
  endpoint: "",
  session: "curran-nov26",
  client: "Curran",
  /* Breakout groups and facilitators. Rename freely; ids must stay unique. */
  groups: [
    { id: "a", name: "Group A", lead: "Zach" },
    { id: "b", name: "Group B", lead: "Dallas" },
    { id: "c", name: "Group C", lead: "Curran leadership" }
  ],
  /* "Your team" choices. Used to show the same problem surfacing from different teams. */
  teams: ["Sales", "Marketing", "Operations & fulfillment", "Customer service", "Leadership", "Other"],
  refreshSeconds: 5
};
